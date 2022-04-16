import db from "../db.js";

await db.init("afk");
await db.init("afk_ignore");

export async function set_afk(user_id, message, update_time) {
    const time = update_time ?? true ? { time: new Date() } : {};

    await db.afk.findOneAndUpdate(
        { user_id },
        { $set: { message, ...time } },
        { upsert: true }
    );
}

export async function clear_afk(member) {
    await db.afk.findOneAndDelete({ user_id: member.id });

    if (member.displayName.startsWith("[AFK]") && member.manageable) {
        await member.edit({ nick: member.displayName.substring(5) });
    }
}

export async function get_afk(user_id) {
    return await db.afk.findOne({ user_id });
}

export async function afk_ignore(channel_id) {
    await db.afk_ignore.findOneAndUpdate(
        { channel_id },
        { $set: { channel_id } },
        { upsert: true }
    );
}

export async function afk_unignore(channel_id) {
    await db.afk_ignore.findOneAndDelete({ channel_id });
}

export async function afk_clear_ignores() {
    await db.afk_ignore.deleteMany({});
}

export async function afk_is_ignored(channel_id) {
    return !!(await db.afk_ignore.findOne({ channel_id }));
}
