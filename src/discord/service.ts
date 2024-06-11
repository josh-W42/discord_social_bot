import { Channel, channel } from "diagnostics_channel";
import {
  DataStore,
  DiscordRequest,
  FIVE_MINUTES,
  ONE_HOUR,
  Sleep,
} from "../utils";
import { CreateMessagePayload, Guild } from "./types";
import { GoogleService } from "../google";
import fs from "fs";
import { youtube_v3 } from "googleapis";
import winston from "winston";

interface DiscordServiceProps {
  googleService: GoogleService;
  logger: winston.Logger;
}

export class DiscordService {
  private _googleService: GoogleService;
  private _logger: winston.Logger;
  private _lastVideoID: string = "";

  constructor({ googleService, logger }: DiscordServiceProps) {
    this._googleService = googleService;
    this._logger = logger.child({ microservice: "DiscordService" });
  }

  public Init() {
    this._lastVideoID = this._getLastVideoId();
    setInterval(() => this.PostNewVideoMessages(), ONE_HOUR);
  }

  private async PostNewVideoMessages() {
    // Check Youtube
    // FoundVideos Should contain the last 5 videos posted.
    const foundVideos = await this._googleService.GetYoutubeVideos();

    if (!this._lastVideoID) {
      this._updateLastVideoId(foundVideos[0].id?.videoId || "");
      return;
    }

    // We reverse the order so that the videos post to discord chronologically.
    foundVideos.reverse();

    const lastVideoIndex = foundVideos.findIndex(
      (video) => video.id?.videoId === this._lastVideoID
    );

    if (lastVideoIndex === -1) {
      // If a user has for some reason posted more than 5 videos in the
      // past hour then post all 5 videos.
      this.CreateDelayedVideoMessages(foundVideos, FIVE_MINUTES);
      return;
    }

    // Post new messages of all new videos with a five minute timer.
    this.CreateDelayedVideoMessages(
      foundVideos.slice(lastVideoIndex + 1),
      FIVE_MINUTES
    );

    this._updateLastVideoId(
      foundVideos[foundVideos.length - 1].id?.videoId || ""
    );
  }

  public async CreateDelayedVideoMessages(
    videos: youtube_v3.Schema$SearchResult[],
    delay: number
  ) {
    let channelID =
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

  private _getLastVideoId(): string {
    let data: DataStore;
    try {
      data = JSON.parse(fs.readFileSync("data.json", "utf-8"));
    } catch (error) {
      this._logger.error(
        "Unable to read data store file. Cannot proceed with Message Process...Terminating...",
        error
      );
      return "";
    }
    return data.lastVideoId;
  }

  private _updateLastVideoId(id: string): void {
    if (!id) return;

    this._lastVideoID = id;
    try {
      fs.writeFileSync(
        "data.json",
        JSON.stringify({
          lastVideoId: id,
        })
      );
    } catch (error) {
      this._logger.error(
        "Unable to update data store file. Cannot proceed with Message Process... Terminating...",
        error
      );
    }
  }
}
