import "dotenv/config";
import express from "express";
import { DiscordRequest } from "./utils";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/test", async (req: express.Request, res: express.Response) => {
  try {
    const discordResponse = await DiscordRequest("/users/@me/guilds", {});

    const data = await discordResponse.json();

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => {
  console.log("Listening on PORT: ", PORT);
});
