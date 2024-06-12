import { DiscordRequest, FIVE_MINUTES, ONE_HOUR, Sleep } from "../utils";
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

  /**
   * Initializes the DiscordService by setting up an interval to periodically
   * update the set of recently posted video IDs and post new video messages.
   */
  public Init() {
    setInterval(async () => {
      // Update the set of recently posted video IDs.
      await this._updatePostedVideos();

      // Post new video messages to Discord.
      await this.PostNewVideoMessages();
    }, ONE_HOUR);
  }

  /**
   * Posts new video messages to Discord by creating delayed messages for each of the new videos found on YouTube.
   *
   * This function retrieves the last 5 videos from YouTube using the `GetYoutubeVideos` method of the `_googleService` object.
   * The videos are then reversed to ensure that they are posted to Discord in chronological order.
   * The new videos are filtered to only include videos that have not already been posted to Discord.
   * The filtered videos are then passed to the `CreateDelayedVideoMessages` method with a delay of 5 minutes.
   */
  private async PostNewVideoMessages() {
    const foundVideos = await this._googleService.GetYoutubeVideos();

    foundVideos.reverse();

    const videosToPost = foundVideos.filter(
      (video) => !this._recentlyPostedVideoIds.has(video.id?.videoId || "")
    );

    this.CreateDelayedVideoMessages(videosToPost, FIVE_MINUTES);
  }

  /**
   * Asynchronously creates delayed video messages for a given list of YouTube search results.
   *
   * @param {youtube_v3.Schema$SearchResult[]} videos - The list of YouTube search results.
   * @param {number} delay - The delay in milliseconds between each video message creation.
   * @return {Promise<void>} A promise that resolves when all video messages have been created.
   */
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

  /**
   * Retrieves the current guilds for the authenticated bot.
   *
   * @return {Promise<Guild[]>} A promise that resolves to an array of Guild objects representing the current guilds.
   * If an error occurs during the retrieval process, an empty array is returned.
   */
  private async DEBUG_GetCurrentGuilds(): Promise<Guild[]> {
    try {
      const discordResponse = await DiscordRequest("/users/@me/guilds", {});
      return (await discordResponse.json()) as Guild[];
    } catch (error) {
      this._logger.error("Error when attempting to Get Current Guilds:", error);
      return [];
    }
  }

  /**
   * Retrieves the channels of a specific guild from the Discord API.
   *
   * @return {Promise<Channel[]>} A promise that resolves to an array of Channel objects representing the channels of the guild.
   * If an error occurs during the retrieval process, an empty array is returned.
   */
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

  /**
   * Sends a message to a specified Discord channel.
   *
   * @param {CreateMessagePayload} data - The message payload containing the content of the message.
   * @param {string} channelID - The ID of the Discord channel to send the message to.
   * @return {Promise<void>} A promise that resolves when the message is successfully sent, or rejects with an error if there was an issue.
   */
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

  /**
   * Retrieves a specified number of messages from a given Discord channel.
   *
   * @param {string} channelID - The ID of the Discord channel to retrieve messages from.
   * @param {number} [limit=5] - The maximum number of messages to retrieve. Defaults to 5.
   * @return {Promise<Message[]>} A promise that resolves to an array of Message objects representing the retrieved messages.
   * If an error occurs during the retrieval process, an empty array is returned.
   */
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

  /**
   * Updates the _recentlyPostedVideoIds set by parsing messages from a specified Discord channel.
   * The function retrieves the channel ID based on the NODE_ENV environment variable.
   *
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
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
