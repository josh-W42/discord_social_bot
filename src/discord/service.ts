import {
  DataStore,
  DiscordRequest,
  FIVE_MINUTES,
  ONE_HOUR,
  Sleep,
} from "../utils";
import { Channel, CreateMessagePayload, Guild, Message } from "./types";
import { GoogleService } from "../google";
import { youtube_v3 } from "googleapis";
import winston from "winston";

interface DiscordServiceProps {
  googleService: GoogleService;
  logger: winston.Logger;
}

export class DiscordService {
  private _googleService: GoogleService;
  private _logger: winston.Logger;
  private _recentlyPostedVideoIds: Set<string> = new Set();

  constructor({ googleService, logger }: DiscordServiceProps) {
    this._googleService = googleService;
    this._logger = logger.child({ microservice: "DiscordService" });
  }

  public Init() {
    setInterval(async () => {
      await this._updatePostedVideos();
      await this.PostNewVideoMessages();
    }, ONE_HOUR);
  }

  private async PostNewVideoMessages() {
    // Check Youtube
    // FoundVideos Should contain the last 5 videos posted.
    const foundVideos = await this._googleService.GetYoutubeVideos();

    // We reverse the order so that the videos post to discord chronologically.
    foundVideos.reverse();

    // Post new messages of all new videos with a five minute timer.
    const videosToPost = foundVideos.filter(
      (video) => !this._recentlyPostedVideoIds.has(video.id?.videoId || "")
    );
    this.CreateDelayedVideoMessages(videosToPost, FIVE_MINUTES);
  }

  public async CreateDelayedVideoMessages(
    videos: youtube_v3.Schema$SearchResult[],
    delay: number
  ) {
    const channelID =
      process.env.NODE_ENV !== "production"
        ? process.env.GUILD_DEBUG_CHANNEL_ID || ""
        : process.env.GUILD_CHANNEL_ID || "";

    for (const video of videos) {
      if (video.id?.videoId) {
        this.CreateMessage(
          {
            content: `New video out!!! Check it out here: https://www.youtube.com/watch?v=${video.id?.videoId}`,
          },
          channelID
        );
        await Sleep(delay);
      }
    }
  }

  private async DEBUG_GetCurrentGuilds(): Promise<Guild[]> {
    try {
      const discordResponse = await DiscordRequest("/users/@me/guilds", {});
      return (await discordResponse.json()) as Guild[];
    } catch (error) {
      this._logger.error("Error when attempting to Get Current Guilds:", error);
      return [];
    }
  }

  private async DEBUG_GetGuildChannels(): Promise<Channel[]> {
    try {
      const discordResponse = await DiscordRequest(
        `/guilds/${process.env.GUILD_ID}/channels`,
        {}
      );
      return (await discordResponse.json()) as Channel[];
    } catch (error) {
      this._logger.error("Error when attempting to get guild channels");
      return [];
    }
  }

  public async CreateMessage(
    data: CreateMessagePayload,
    channelID: string
  ): Promise<void> {
    try {
      await DiscordRequest(`/channels/${channelID}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      this._logger.error("Error when attempting to post message.", error);
    }
  }

  public async GetChannelMessages(
    channelID: string,
    limit: number = 5
  ): Promise<Message[]> {
    try {
      const response = await DiscordRequest(
        `/channels/${channelID}/messages?limit=${limit}`,
        {}
      );
      return (await response.json()) as Message[];
    } catch (error) {
      this._logger.error(
        "Error occurred when fetching channel messages: ",
        error
      );
      return [];
    }
  }

  private async _updatePostedVideos() {
    const channelID =
      process.env.NODE_ENV !== "production"
        ? process.env.GUILD_DEBUG_CHANNEL_ID || ""
        : process.env.GUILD_CHANNEL_ID || "";

    const messages = await this.GetChannelMessages(channelID, 20);
    this._recentlyPostedVideoIds.clear();
    messages.forEach((message) => {
      const url = message.content
        .split(" ")
        .find((word) => word.includes("www.youtube.com"));

      if (url) {
        this._recentlyPostedVideoIds.add(
          url.split("https://www.youtube.com/watch?v=")[1]
        );
      }
    });
  }
}
