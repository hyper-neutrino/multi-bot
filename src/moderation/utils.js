import client from "../client.js";
import db from "../db.js";
import { has_permission } from "../lib/permissions.js";

export async function mod_fail(mod, user) {
    try {
        const member = await client.home.members.fetch(user.id);
        if (await has_permission("immunity", member)) {
            return `${user} cannot be moderated without being demoted first.`;
        }
        const cmp = mod.roles.highest.comparePositionTo(member.roles.highest);
        if (cmp < 0) {
            return `${user} outranks you.`;
        } else if (cmp == 0) {
            return `${user} has the same rank as you.`;
        }
    } catch {
        return false;
    }
}

export async function link_origin(id, url) {
    await db.history.findOneAndUpdate({ id }, { $set: { url } });
}
