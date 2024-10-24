const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family: sans-serif;
        font-size: 14px;
        margin: 0;
        background-color: whitesmoke;
      }
      main {
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
      }
      @media (min-width: 600px) {
        main {
          margin-top: 8px;
          margin-bottom: 8px;
          border-radius: 5px;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        }
      }
      ul {
        list-style-type: none;
        margin: 0;
        padding: 8px 0;
      }
      li {
        display: flex;
      }
      li > a {
        min-width: 0;
        padding: 16px;
        flex-grow: 1;
        color: initial;
        text-decoration: none;
        transition: background-color 0.3s;
      }
      li > a:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      .stack {
        display: flex;
      }
      .stack.direction-column {
        flex-direction: column;
      }
      .list-avatar {
        flex-shrink: 0;
        margin-right: 8px;
        overflow: hidden;
        display: flex;
        border-radius: 50%;
      }
      .list-text {
        min-width: 0;
        flex-grow: 1;
        line-height: 1.5;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      p {
        margin: 0;
      }
      .list-text > p {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .list-text-primary {
        font-weight: bold;
      }
      .list-text-secondary {
        color: #666;
        font-size: 0.9em;
      }
      .description {
        margin-top: 8px;
        white-space: pre-wrap;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-clamp: 3;
        -webkit-line-clamp: 3;
        font-size: 0.9em;
      }
      .description:empty {
        display: none;
      }
      li > hr {
        margin: 0;
        border: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        width: 100%;
      }
    </style>
  </head>
  <body>
    <template id="link-template">
      <li>
        <a>
          <div class="stack direction-column">
            <div class="stack">
              <div class="list-avatar">
                <img width="48" height="48" />
              </div>
              <div class="list-text">
                <p class="list-text-primary"></p>
                <p class="list-text-secondary"></p>
              </div>
            </div>
            <div class="description"></div>
          </div>
        </a>
      </li>
    </template>
    <main id="app">
      <ul id="actors"></ul>
    </main>
    <script>
      (async () => {
        const __BSKY_ACTORS__ = "{{__BSKY_ACTORS_VALUE__}}";
        const actors = decodeURIComponent(__BSKY_ACTORS__).split(",");
        const ACTORS_CHUNK_SIZE = 25;
        const PROFILES_API =
          "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles";
        for (let i = 0; i < actors.length; i += ACTORS_CHUNK_SIZE) {
          const chunk = actors.slice(i, i + ACTORS_CHUNK_SIZE);
          const searchParams = new URLSearchParams(
            chunk.map((handle) => ["actors", handle])
          );
          const response = await fetch(PROFILES_API + "?" + searchParams);
          const { profiles } = await response.json();
          profiles.forEach((profile) => {
            const displayName = profile.displayName || profile.handle;
            const template = document.getElementById("link-template");
            const clone = template.content.cloneNode(true);
            const a = clone.querySelector("a");
            a.href = "https://" + profile.handle;
            a.target = "_blank";
            const img = clone.querySelector("img");
            img.src = profile.avatar;
            img.alt = profile.handle;
            const primary = clone.querySelector(".list-text-primary");
            primary.textContent = displayName;
            const secondary = clone.querySelector(
              ".list-text .list-text-secondary"
            );
            secondary.textContent = "@" + profile.handle;
            const description = clone.querySelector(".description");
            description.textContent = profile.description;

            const actorsElement = document.getElementById("actors");
            if (actorsElement.childElementCount) {
              const li = document.createElement("li");
              li.appendChild(document.createElement("hr"));
              actorsElement.appendChild(li);
            }
            actorsElement.appendChild(clone);
          });
        }
      })();
    </script>
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
    const handles = records.map((record) =>
      record.name.replace("_atproto.", "")
    );
    return new Response(
      HTML_TEMPLATE.replace(
        "{{__BSKY_ACTORS_VALUE__}}",
        encodeURIComponent(handles.join(","))
      ),
      { headers: { "Content-Type": "text-html" } }
    );
  },
};
