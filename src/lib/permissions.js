import client from "../client.js";
import config from "../config.js";
import db from "../db.js";
import object from "../guild_scope.js";

export async function add_permission(key, snowflake) {
    await db.permissions.findOneAndUpdate(
        { key },
        { $addToSet: { snowflakes: snowflake } },
        { upsert: true }
    );
}

export async function rm_permission(key, snowflake) {
    await db.permissions.findOneAndUpdate(
        { key },
        { $pull: { snowflakes: snowflake } }
    );
}

export async function clear_permission(key) {
    await db.permissions.findOneAndUpdate(
        { key },
        { $set: { snowflakes: [] } }
    );
}

export async function get_permission(key) {
    const entry = await db.permissions.findOne({ key });
    if (!entry) return [];
    return entry.snowflakes || [];
}

export async function has_permission(key, member) {
    if (!member) return false;
    if (member.id == client.user.id) return true;
    if (object.owners.indexOf(member.id) != -1) return true;
    if (key == "@everyone" || !key) return true;
    if (member.guild.ownerId == member.id) return true;
    const entry = await db.permissions.findOne({ key });
    if (!entry) return false;
    if (!entry.snowflakes) return false;
    const snowflakes = new Set(entry.snowflakes);
    if (snowflakes.has(member.id)) return true;
    for (const id of member.roles.cache.keys()) {
        if (snowflakes.has(id)) return true;
    }
    return false;
}

const permission_list = new Set();

export function create_permission(key) {
    permission_list.add(key);
}

export async function autocomplete(_, query) {
    return [...permission_list].sort().filter((item) => item.match(query));
}
