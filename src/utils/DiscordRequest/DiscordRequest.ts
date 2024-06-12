/**
 * Request wrapper for making Requests to the discord API.
 * @param endpoint - The API endpoint ex. /channels/...
 * @param options - Request options to pass along when fetch is performed Ex. searchParams
 * @returns - A response - Throws an error if response is not code 200
 */
export async function DiscordRequest(endpoint: string, options: RequestInit) {
  const url = "https://discord.com/api/v10/" + endpoint;

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
    throw new Error(JSON.stringify(data));
  }

  return res;
}
