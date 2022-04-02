import db from "../db.js";

export async function link_supporter_role(role_id, title, body) {
    await db.supporter_announcements.findOneAndUpdate(
        {
            role_id,
        },
        { $set: { title, body } },
        { upsert: true }
    );
}

export async function unlink_supporter_role(role_id) {
    await db.supporter_announcements.findOneAndDelete({ role_id });
}

export async function get_supporter_announcement(role_id) {
    return await db.supporter_announcements.findOne({ role_id });
}
