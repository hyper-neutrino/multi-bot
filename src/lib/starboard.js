import client from "../client.js";
import db from "../db.js";
import { get_setting, get_setting_channel } from "./settings.js";

export async function get_starboard(channel) {
    do {
        const id = await get_setting(`starboard.${channel.id}`);
        if (id) {
            try {
                return await client.channels.fetch(id);
            } catch {
                return undefined;
            }
        }
    } while ((channel = channel.parent));

    return await get_setting_channel("starboard.default");
}

export async function create_star_link(source_id, target_id) {
    await db.starboard.insertOne({ source_id, target_id });
}

export async function get_star_link(starboard, message) {
    const entry = await db.starboard.findOne({ source_id: message.id });
    if (!entry) return undefined;

    try {
        return await starboard.messages.fetch(entry.target_id);
    } catch {
        return undefined;
    }
}

export async function destroy_star_link(source_id) {
    await db.starboard.findOneAndDelete({ source_id });
}
