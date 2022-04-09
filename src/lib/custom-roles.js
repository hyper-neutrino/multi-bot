import client from "../client.js";
import db from "../db.js";
import { get_setting_role } from "./settings.js";

await db.init("custom_roles");

export async function has_custom_role(member) {
    return await db.custom_roles.findOne({ user_id: member.id });
}

export async function get_custom_role(member, create) {
    const entry = await has_custom_role(member);
    if (!entry) return create ? await make_custom_role(member) : undefined;

    try {
        const role = await client.home.roles.fetch(entry.role_id);
        if (!role) throw 0;
        return role;
    } catch {
        return create ? await make_custom_role(member) : undefined;
    }
}

export async function destroy_custom_role(member) {
    const role = await get_custom_role(member, false);

    if (role) {
        try {
            await role.delete();
        } catch {}
    }

    await db.custom_roles.findOneAndDelete({ user_id: member.id });
}

async function make_custom_role(member) {
    const anchor = await get_setting_role("custom-role-anchor");
    const role = await client.home.roles.create({
        position: anchor && anchor.position,
        permissions: [],
    });

    await member.roles.add(role);
    await db.custom_roles.findOneAndUpdate(
        { user_id: member.id },
        { $set: { role_id: role.id } },
        { upsert: true }
    );

    return role;
}
