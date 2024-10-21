export default {
  async fetch(request, env) {
    const host = new URL(request.url).host;
    const normHost = host.toUpperCase().replace(/[-.]/g, "_");
    const zoneID = env[`ZONE_ID_${normHost}`] || env.ZONE_ID;

    if (!zoneID || !env.CLOUDFLARE_API_KEY)
      return new Response("Bad Request", { status: 400 });

    const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records?type=TXT&name.startswith=_atproto`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_KEY}`, 'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return response;
    const data = await response.json();
    const { result: records } = data;
    const links = records.map(record => {
      const subdomain = record.name.replace("_atproto.", "");
      return `<a href="https://${subdomain}">${subdomain}</a>`;
    })
    return new Response(links.join("<br/>"), { headers: { 'Content-Type': "text-html" } });
  },
};
