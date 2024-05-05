import "dotenv/config";
import { DiscordService } from "./discord";
import { GoogleService } from "./google";
import fs from "fs";
import { createLogger, format, transports } from "winston";
import { APIService } from "./api";

/**
 * What needs to be saved (IF THIS APPLIES TO MORE THAN ONE SERVER / GUILD):
 * 1. The Youtube Channel that someone wants tracked.
 * 2. The id of a Guild associated with this tracking.
 * 3. The id of a channel that the bot will post the link to.
 */

(() => {
  const { combine, timestamp, json, errors, splat } = format;

  const logger = createLogger({
    level: "info",
    exitOnError: false,
    format: combine(
      timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      errors({ stack: true }),
      json()
    ),
    defaultMeta: { service: "DNA_Bot Server" },
    transports: [
      new transports.File({
        filename: "./logs/errors.log",
        level: "error",
        lazy: true,
        zippedArchive: true,
        maxsize: 10000000,
      }),
      new transports.File({
        filename: "./logs/combined.log",
        lazy: true,
        zippedArchive: true,
        maxsize: 10000000,
      }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new transports.Console({
        level: "info",
        format: combine(
          format.simple(),
          format.prettyPrint({ colorize: true }),
          format.timestamp()
        ),
      })
    );
  }

  const googleService = new GoogleService({
    logger,
  });
  const discordService = new DiscordService({
    googleService,
    logger,
  });
  // Not Currently Used
  // const api = new APIService({
  //   discordService,
  //   googleService,
  //   logger,
  // });

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

  logger.addListener("data", (chunk) => {
    if (chunk?.level === "error" || chunk?.level === "warn") {
      discordService.CreateMessage(
        {
          content: `🔴 ${chunk?.service} - Issue in: ${chunk?.microservice} - Log Level:${chunk?.level} 🔴`,
        },
        process.env.GUILD_DEBUG_CHANNEL_ID || ""
      );
    }
  });

  discordService.CreateMessage(
    {
      content: "🟢 Bot is UP 🟢",
    },
    process.env.GUILD_DEBUG_CHANNEL_ID || ""
  );

  discordService.Init();
  // Not Currently Used
  // api.Init();
})();
