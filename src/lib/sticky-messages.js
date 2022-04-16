import db from "../db.js";

await db.init("stickies");

export async function set_stick(channel_id, content) {
    await db.stickies.findOneAndUpdate(
        { channel_id },
        { $set: { content } },
        { upsert: true }
    );
}

export async function link_stick(channel_id, message_id) {
    await db.stickies.findOneAndUpdate(
        { channel_id },
        { $set: { message_id } },
        { upsert: true }
    );
}

export async function unstick(channel_id) {
    await db.stickies.findOneAndDelete({ channel_id });
}

export async function get_stick_content(channel) {
    const entry = await db.stickies.findOne({ channel_id: channel.id });
    return entry?.content;
}

export async function get_stick_message(channel) {
    const entry = await db.stickies.findOne({ channel_id: channel.id });
    if (!entry) return undefined;

    try {
        return await channel.messages.fetch(entry.message_id);
    } catch {
        return undefined;
    }
}
