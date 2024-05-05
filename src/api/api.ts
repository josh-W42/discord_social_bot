import express from "express";
import cors from "cors";
import { DiscordService } from "../discord";
import { GoogleService } from "../google";
import winston from "winston";

interface APIConstructorProps {
  discordService: DiscordService;
  googleService: GoogleService;
  logger: winston.Logger;
}

export class APIService {
  private _app: express.Express;
  private _discordService: DiscordService;
  private _googleService: GoogleService;
  private _logger: winston.Logger;

  /**
   * Creates a new API service instance.
   * Listens for Incoming HTTP Requests to Server.
   */
  constructor({ discordService, googleService, logger }: APIConstructorProps) {
    this._app = express();
    this._discordService = discordService;
    this._googleService = googleService;
    this._logger = logger;
  }

  public Init() {
    this._app.use(cors());
    const PORT = process.env.PORT || 3000;

    this._app.listen(PORT, () => {
      this._logger.log("info", `API Running on Port ${PORT}`);
    });
  }
}
