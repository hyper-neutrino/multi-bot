import client from "./client.js";
import config from "./config.js";
import object from "./guild_scope.js";

import { start } from "./lib/scheduler.js";

process.on("uncaughtException", (error) => {
    console.error(error.stack);
});

client.on("ready", async () => {
    await client.init();
    try {
        client.home = await client.guilds.fetch(object.id);
        for (const listener of client.home_listeners) {
            await listener(client.home);
        }
    } catch {
        console.error(`Could not load the guild with ID ${object.id}.`);
    }
    start();
    console.log("hyper-bot is ready");
});

client.run(config.discord_token);
