import db from "../db.js";

export async function add_highlight(user_id, term) {
    await db.highlights.insertOne({ user_id, term });
}

export async function rm_highlight(user_id, term) {
    await db.highlights.findOneAndDelete({ user_id, term });
}

export async function is_highlighted(user_id, term) {
    const entry = await db.highlights.findOne({ user_id, term });
    return !!entry;
}

export async function get_highlights(user_id) {
    return await db.highlights.find({ user_id }).toArray();
}

export async function get_highlighting_users() {
    return await db.highlights.distinct("user_id");
}
