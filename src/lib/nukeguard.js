import db from "../db.js";

export async function protect_channel(channel_id) {
    await db.protected_channels.findOneAndUpdate(
        { channel_id },
        { $set: { channel_id } },
        { upsert: true }
    );
}

export async function unprotect_channel(channel_id) {
    await db.protected_channels.findOneAndDelete({ channel_id });
}

export async function is_protected_channel(channel_id) {
    return !!(await db.protected_channels.findOne({ channel_id }));
}
