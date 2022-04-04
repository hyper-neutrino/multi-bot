import db from "../db.js";

export async function set_counter(channel_id, count) {
    await db.count_channels.findOneAndUpdate(
        { channel_id },
        { $set: { count } },
        { upsert: true }
    );
}

export async function get_counter(channel_id) {
    return await db.count_channels.findOne({ channel_id });
}

export async function rm_counter(channel_id) {
    await db.count_channels.findOneAndDelete({ channel_id });
}

export async function increment_counter(channel_id, user_id) {
    await db.count_channels.findOneAndUpdate(
        { channel_id },
        { $inc: { count: 1 }, $set: { user_id } }
    );

    await db.counterboard.findOneAndUpdate(
        { user_id },
        { $inc: { score: 1 } },
        { upsert: true }
    );
}

export async function get_counter_score(user_id) {
    const entry = await db.counterboard.findOne({ user_id });
    if (!entry) return 0;

    return entry.score;
}

export async function get_counter_scoreboard() {
    return await db.counterboard.find({}).toArray();
}
