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
