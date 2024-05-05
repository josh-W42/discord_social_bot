import { Channel, channel } from "diagnostics_channel";
import {
  DataStore,
  DiscordRequest,
  FIVE_MINUTES,
  FIVE_SECONDS,
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

  constructor({ googleService, logger }: DiscordServiceProps) {
    this._googleService = googleService;
    this._logger = logger.child({ microservice: "DiscordService" });
  }

  public Init() {
    setInterval(() => {
      // Check Youtube
      this._googleService.GetYoutubeVideos().then((foundVideos) => {
        // FoundVideos Should contain the last 5 videos posted.
        let data: DataStore;
        try {
          data = JSON.parse(fs.readFileSync("data.json", "utf-8"));
        } catch (error) {
          this._logger.error(
            "Unable to read data store file. Cannot proceed with Message Process...Terminating...",
            error
          );
          return;
        }

        if (!data.lastVideoId) {
          // If we've never posted a video before, Don't post a message
          // but store the most recent video's id for next time.
          try {
            fs.writeFileSync(
              "data.json",
              JSON.stringify({
                lastVideoId: foundVideos[0].id?.videoId || "",
              })
            );
          } catch (error) {
            this._logger.error(
              "Unable to update data store file. Cannot proceed with Message Process... Terminating...",
              error
            );
          }
          return;
        }

        // Looks like a duplicate but the logic is this
        // if there is NOT a lastVideoId we want to update the file and NOT DO ANYTHING.
        // If there IS a lastVideoId we do still want to update the file.
        try {
          fs.writeFileSync(
            "data.json",
            JSON.stringify({
              lastVideoId: foundVideos[0].id?.videoId || "",
            })
          );
        } catch (error) {
          this._logger.error(
            "Unable to update data store file. Cannot proceed with Message Process... Terminating...",
            error
          );
        }

        const lastVideoIndex = foundVideos.findIndex(
          (video) => video.id?.videoId === data.lastVideoId
        );

        if (lastVideoIndex === -1) {
          // If a user has for some reason posted more than 5 videos in the
          // past hour then post all 5 videos.
          this.CreateDelayedVideoMessages(foundVideos, FIVE_MINUTES);
          return;
        }

        // Post new messages of all new videos with a five minute timer.
        this.CreateDelayedVideoMessages(
          foundVideos.slice(0, lastVideoIndex),
          FIVE_MINUTES
        );
      });
    }, ONE_HOUR);
  }

  public async CreateDelayedVideoMessages(
    videos: youtube_v3.Schema$SearchResult[],
    delay: number
  ) {
    for (const video of videos) {
      if (video.id?.videoId) {
        this.CreateMessage(
          {
            content: `New video out!!! Check it out here: https://www.youtube.com/watch?v=${video.id?.videoId}`,
          },
          process.env.GUILD_CHANNEL_ID || ""
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
    guildID: string
  ): Promise<void> {
    try {
      await DiscordRequest(`/channels/${guildID}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      this._logger.error("Error when attempting to post message.", error);
    }
  }
}
