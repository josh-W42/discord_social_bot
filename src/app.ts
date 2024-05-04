import "dotenv/config";
import { APIService } from "./api";
import { DiscordService } from "./discord";
import { GoogleService } from "./google";
import fs from "fs";

/**
 * What needs to be saved (IF THIS APPLIES TO MORE THAN ONE SERVER):
 * 1. The Youtube Channel that someone wants tracked.
 * 2. The id of a Guild associated with this tracking.
 * 3. The id of a channel that the bot will post the link to.
 */

(() => {
  const googleService = new GoogleService();
  const discordService = new DiscordService({
    googleService,
  });
  const api = new APIService({
    discordService,
    googleService,
  });

  // Initialize "DataBase"
  try {
    fs.writeFileSync(
      "data.json",
      JSON.stringify({
        lastVideoId: "",
      }),
      { flag: "wx" }
    );
  } catch (error) {
    // File exists
  }

  discordService.Init();
  api.Init();
})();
