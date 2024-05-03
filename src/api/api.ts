import express from "express";
import cors from "cors";
import { DiscordService } from "../discord";

interface APIConstructorProps {
  discordService: DiscordService;
}

export class APIService {
  private _app: express.Express;
  private _discordService: DiscordService;

  /**
   * Creates a new API service instance.
   * Listens for Incoming HTTP Requests to Server.
   */
  constructor({ discordService }: APIConstructorProps) {
    this._app = express();
    this._discordService = discordService;
  }

  public Init() {
    this._app.use(cors());
    const PORT = process.env.PORT || 3000;

    this._app.listen(PORT, () => {
      console.log("API Running on Port: ", PORT);
    });
  }
}
