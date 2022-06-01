import client from "../client.js";
import db from "../db.js";

await db.init("settings");

export async function set_setting(key, value) {
    await db.settings.findOneAndUpdate(
        { key },
        { $set: { value } },
        { upsert: true }
    );
}

export async function get_setting(key) {
    const entry = await db.settings.findOne({ key });
    return entry?.value;
}

export async function get_setting_role(key) {
    const snowflake = await get_setting(key);
    if (!snowflake) return undefined;
    try {
        return await client.home.roles.fetch(snowflake);
    } catch {
        return undefined;
    }
}

export async function get_setting_channel(key) {
    const snowflake = await get_setting(key);
    if (!snowflake) return undefined;
    try {
        return await client.channels.fetch(snowflake);
    } catch {
        return undefined;
    }
}
