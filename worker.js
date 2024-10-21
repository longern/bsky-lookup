const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-family: sans-serif;
        margin: 0;
      }
      main {
        max-width: 600px;
        margin: 0 auto;
      }
      ul {
        list-style-type: none;
        margin: 0;
        padding: 8px 0;
      }
      li { display: flex; }
      li>a {
        padding: 8px 16px;
        flex-grow: 1;
        transition: background-color 0.3s;
      }
      li>a:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    </style>
  </head>
  <body>
    <main>
      <ul>{{links}}</ul>
    </main>
  </body>
</html>
`;

export default {
  async fetch(request, env) {
    const host = new URL(request.url).host;
    const normHost = host.toUpperCase().replace(/[-.]/g, "_");
    const zoneID = env[`ZONE_ID_${normHost}`] || env.ZONE_ID;

    if (!zoneID || !env.CLOUDFLARE_API_KEY)
      return new Response("Bad Request", { status: 400 });

    const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records?type=TXT&name.startswith=_atproto`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) return response;
    const data = await response.json();
    const { result: records } = data;
    const links = records.map((record) => {
      const subdomain = record.name.replace("_atproto.", "");
      return `<li><a href="https://${subdomain}">@${subdomain}</a></li>`;
    });
    return new Response(
      HTML_TEMPLATE.replace("{{links}}", links.join("")),
      { headers: { "Content-Type": "text-html" } }
    );
  },
};
