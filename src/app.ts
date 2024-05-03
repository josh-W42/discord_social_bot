import "dotenv/config";
import { APIService } from "./api";
import { DiscordService } from "./discord";

/**
 * What needs to be saved (IF THIS APPLIES TO MORE THAN ONE SERVER):
 * 1. The Youtube Channel that someone wants tracked.
 * 2. The id of a Guild associated with this tracking.
 * 3. The id of a channel that the bot will post the link to.
 */

(() => {
  const service = new DiscordService();

  const api = new APIService({
    discordService: service,
  });

  api.Init();
})();
