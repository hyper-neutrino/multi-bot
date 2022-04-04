import client from "../client.js";
import db from "../db.js";
import { dict_format, user_count } from "./utils.js";

export async function bind_channel(channel_id, format) {
    await db.stats_channels.findOneAndUpdate(
        { channel_id },
        { $set: { format } },
        { upsert: true }
    );
}

export async function unbind_channel(channel_id) {
    await db.stats_channels.findOneAndDelete({ channel_id });
}

export async function get_stats_channels() {
    return await db.stats_channels.find({}).toArray();
}

setInterval(async () => {
    for (const entry of await get_stats_channels()) {
        try {
            const channel = await client.channels.fetch(entry.channel_id);

            const { bots, humans } = user_count(channel.guild);

            const name = await dict_format(entry.format, {
                guild: channel.guild.name,
                members: channel.guild.memberCount,
                bots: bots.toString(),
                humans: humans.toString(),
                boosts: channel.guild.premiumSubscriptionCount,
            });

            if (name == channel.name) continue;

            await channel.edit({ name });
        } catch {}
    }
}, 10000);
