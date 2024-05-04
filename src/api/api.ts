import express from "express";
import cors from "cors";
import { DiscordService } from "../discord";
import { GoogleService } from "../google";

interface APIConstructorProps {
  discordService: DiscordService;
  googleService: GoogleService;
}

export class APIService {
  private _app: express.Express;
  private _discordService: DiscordService;
  private _googleService: GoogleService;

  /**
   * Creates a new API service instance.
   * Listens for Incoming HTTP Requests to Server.
   */
  constructor({ discordService, googleService }: APIConstructorProps) {
    this._app = express();
    this._discordService = discordService;
    this._googleService = googleService;
  }

  public Init() {
    this._app.use(cors());
    const PORT = process.env.PORT || 3000;

    this._app.listen(PORT, () => {
      console.log("API Running on Port: ", PORT);
    });
  }
}
