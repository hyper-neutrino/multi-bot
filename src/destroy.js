import client from "./client.js";
import config from "./config.js";
import object from "./guild_scope.js";

client.on("ready", async () => {
    const guild = await client.guilds.fetch(object.id);
    const commands = await guild.commands.fetch();
    for (const id of commands.keys()) {
        console.log(`Destroying command with ID ${id}.`);
        await guild.commands.delete(id);
    }
    client.destroy();
    process.exit(0);
});

client.run(config.discord_token);
