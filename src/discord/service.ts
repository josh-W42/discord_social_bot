import { Channel } from "diagnostics_channel";
import { DiscordRequest } from "../utils";
import { CreateMessagePayload, Guild } from "./types";

export class DiscordService {
  private async DEBUG_GetCurrentGuilds(): Promise<Guild[]> {
    try {
      const discordResponse = await DiscordRequest("/users/@me/guilds", {});
      return (await discordResponse.json()) as Guild[];
    } catch (error) {
      console.error(
        "DiscordService: Error when attempting to Get Current Guilds:",
        error
      );
      return [];
    }
  }

  private async DEBUG_GetGuildChannels(): Promise<Channel[]> {
    try {
      const discordResponse = await DiscordRequest(
        `/guilds/${process.env.TEST_GUILD_ID}/channels`,
        {}
      );
      return (await discordResponse.json()) as Channel[];
    } catch (error) {
      console.error(
        "DiscordService: Error when attempting to get guild channels"
      );
      return [];
    }
  }

  public async CreateMessage(data: CreateMessagePayload): Promise<void> {
    try {
      await DiscordRequest(
        `/channels/${process.env.TEST_GUILD_CHANNEL_ID}/messages`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.error(
        "DiscordService: Error when attempting to post message.",
        error
      );
    }
  }
}
