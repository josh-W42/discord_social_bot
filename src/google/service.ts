import { google, youtube_v3 } from "googleapis";
import winston from "winston";

interface GoogleServiceProps {
  logger: winston.Logger;
}

export class GoogleService {
  private _youtube;
  private _logger: winston.Logger;

  constructor({ logger }: GoogleServiceProps) {
    this._youtube = google.youtube({
      version: "v3",
      auth: process.env.GOOGLE_API_KEY,
    });
    this._logger = logger.child({ microservice: "GoogleService" });
  }

  public async GetYoutubeVideos(): Promise<youtube_v3.Schema$SearchResult[]> {
    try {
      const response = await this._youtube.search.list({
        part: ["snippet"],
        channelId: process.env.YOUTUBE_CHANNEL_ID,
        order: "date",
      });

      if (response.status !== 200) {
        throw new Error(`${response.status}, ${response.statusText}`);
      }

      return response.data.items || [];
    } catch (error) {
      this._logger.error(
        "Error occurred when fetching youtube videos: ",
        error
      );
      return [];
    }
  }
}
