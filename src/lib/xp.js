import db from "../db.js";

await db.init("xp");

export async function add_xp(user_id, text, voice) {
    await db.xp.findOneAndUpdate(
        { user_id },
        {
            $inc: {
                "all-time.text": text,
                "monthly.text": text,
                "weekly.text": text,
                "daily.text": text,
                "all-time.voice": voice,
                "monthly.voice": voice,
                "weekly.voice": voice,
                "daily.voice": voice,
            },
        },
        { upsert: true }
    );
}

export async function get_xp(user_id) {
    const entry = await db.xp.findOne({ user_id });
    if (!entry) {
        const z = { text: 0, voice: 0 };
        return { "all-time": z, monthly: z, weekly: z, daily: z };
    }
    return entry;
}

export async function get_leaderboard() {
    return await db.xp.find({}).toArray();
}
