import client from "../client.js";

export async function fetch_snowflake(guild, snowflake) {
    try {
        const member = await guild.members.fetch(snowflake);
        return member;
    } catch {}
    try {
        const user = await client.users.fetch(snowflake);
        return user;
    } catch {}
    try {
        const role = await guild.roles.fetch(snowflake);
        return role;
    } catch {}
    try {
        const channel = await client.channels.fetch(snowflake);
        return channel;
    } catch {}
}

export function is_string(object) {
    return typeof object == "string" || object instanceof String;
}

// https://stackoverflow.com/a/6969486
export function escape_regex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function group(items, sep, length) {
    const result = [];
    for (const item of items) {
        if (result.length == 0) result.push(item);
        else {
            const next = result[result.length - 1] + sep + item;
            if (next.length > length) {
                result.push(item);
            } else {
                result[result.length - 1] = next;
            }
        }
    }
    return result;
}
