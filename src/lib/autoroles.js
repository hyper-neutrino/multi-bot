import db from "../db.js";

await db.init("autoroles");

export async function set_autoroles(user_id, roles) {
    await db.autoroles.findOneAndUpdate(
        { user_id },
        { $set: { roles } },
        { upsert: true }
    );
}

export async function get_autoroles(user_id) {
    const entry = await db.autoroles.findOne({ user_id });
    return entry?.roles || [];
}

export async function add_autorole(user_id, role_id) {
    await db.autoroles.findOneAndUpdate(
        { user_id },
        { $addToSet: { roles: role_id } },
        { upsert: true }
    );
}

export async function rm_autorole(user_id, role_id) {
    await db.autoroles.findOneAndUpdate(
        { user_id },
        { $pull: { roles: role_id } }
    );
}
