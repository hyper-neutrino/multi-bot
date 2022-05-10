import db from "../db.js";

await db.init("notes");

export async function get_notes(user_id) {
    const entry = await db.notes.findOne({ user_id });
    return entry?.notes ?? "";
}

export async function set_notes(user_id, notes) {
    await db.notes.findOneAndUpdate(
        { user_id },
        { $set: { notes } },
        { upsert: true }
    );
}
