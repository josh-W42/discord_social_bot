// Borrowed from Discord Example App repo (https://github.com/discord/discord-example-app/blob/main/utils.js)

export async function DiscordRequest(endpoint: string, options: RequestInit) {
  const url = "https://discord.com/api/v10/" + endpoint;

  if (options.body) options.body = JSON.stringify(options.body);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent":
        "Discord (https://github.com/josh-W42/discord_social_bot, 1.0.0)",
    },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }

  return res;
}
