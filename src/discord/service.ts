import { Channel } from "diagnostics_channel";
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

interface DiscordServiceProps {
  googleService: GoogleService;
}

export class DiscordService {
  private _googleService: GoogleService;

  constructor({ googleService }: DiscordServiceProps) {
    this._googleService = googleService;
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
          console.error(
            "DiscordService: Unable to read data store file.\n Cannot proceed with Message Process...\n Terminating...",
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
            console.error(
              "DiscordService: Unable to update data store file.\n Cannot proceed with Message Process...\n Terminating...",
              error
            );
          }
          return;
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
        this.CreateMessage({
          content: `New video out! Come check it out! https://www.youtube.com/watch?v=${video.id?.videoId}`,
        });
        await Sleep(delay);
      }
    }
  }

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
