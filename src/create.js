import client from "./client.js";
import config from "./config.js";
import object from "./guild_scope.js";

process.on("uncaughtException", (error) => {
    console.error(error.stack);
});

client.on("ready", async () => {
    await client.init();
    await client.deploy({
        guild_id: object.id,
        commands: process.argv.length > 3 ? process.argv.slice(3) : undefined,
        log: true,
    });
    console.log("Done; logging out.");
    client.destroy();
    process.exit(0);
});

client.run(config.discord_token);
