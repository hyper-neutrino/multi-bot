import client from "../client.js";
import db from "../db.js";
import { has_permission } from "../lib/permissions.js";
import { get_setting } from "../lib/settings.js";

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

export async function reason_fields(reason, appeal) {
    const fields = [];

    if (reason) fields.push({ name: "Reason", value: reason });

    if (appeal) {
        const form = await get_setting("appeal-form");

        if (form) {
            fields.push({
                name: "Appeal",
                value: `You can appeal this decision [here](${form}). However, we will not make any promises that your punishment will be reconsidered.`,
            });
        }
    }

    return fields;
}
