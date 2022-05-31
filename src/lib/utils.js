import client from "../client.js";
import { get_setting } from "./settings.js";

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

export async function parse_message_link(url) {
    const match = url.match(
        /^https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)$/
    );

    try {
        if (!match) throw 0;
        const guild = await client.guilds.fetch(match[1]);
        const channel = await guild.channels.fetch(match[2]);
        const message = await channel.messages.fetch(match[3]);
        return message;
    } catch {
        return undefined;
    }
}

export async function recursive_edit(object, fn) {
    if (Array.isArray(object)) {
        return await Promise.all(
            object.map(async (x) => await recursive_edit(x, fn))
        );
    } else if (is_string(object) || Object.keys(object).length == 0) {
        return await fn(object);
    } else {
        const output = {};
        for (const key of Object.keys(object)) {
            output[key] = await recursive_edit(object[key], fn);
        }
        return output;
    }
}

export function user_count(guild) {
    let bots = 0,
        humans = 0;

    for (const m of guild.members.cache.values()) {
        if (m.user.bot) ++bots;
        else ++humans;
    }
    return { bots, humans };
}

export async function translate(string, member, count) {
    if (!is_string(string)) return string;

    if (string == "{color}") return await get_setting("embed-color");

    const { bots, humans } = user_count(member.guild);

    return dict_format(string, {
        username: member.user.username,
        nickname: member.displayName,
        tag: member.user.tag,
        mention: member.toString(),
        discriminator: member.user.discriminator,
        avatar: member.displayAvatarURL({ dynamic: true }),
        count: count.toString(),
        color: await get_setting("embed-color"),
        guild: member.guild.name,
        members: member.guild.memberCount,
        bots: bots.toString(),
        humans: humans.toString(),
        boosts: member.guild.premiumSubscriptionCount,
    });
}

export function dict_format(string, map) {
    if (!is_string(string)) return string;

    for (const key of Object.keys(map)) {
        string = string.replaceAll(`{${key}}`, map[key]);
    }

    return string;
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

export async function member_info(cmd, user, member) {
    return {
        title: `Member info for ${user.tag}`,
        description: user.bot ? "**This user is a bot.**" : "",
        color: member.displayColor,
        thumbnail: {
            url: member.displayAvatarURL({ dynamic: true }),
        },
        fields: [
            {
                name: "ID",
                value: `\`${user.id}\``,
            },
            {
                name: "Creation Date",
                value: timestamp(user.createdAt),
            },
            {
                name: "Join Date",
                value: timestamp(member.joinedAt),
            },
            {
                name: "Display Color",
                value: `\`${member.displayHexColor}\``,
            },
            member.premiumSinceTimestamp
                ? {
                      name: "Boosting Since",
                      value: timestamp(new Date(member.premiumSinceTimestamp)),
                  }
                : [],
            ((custom) =>
                custom
                    ? {
                          name: "Custom Role",
                          value: custom.toString(),
                      }
                    : [])(await get_custom_role(member, false)),
            {
                name: "Roles",
                value:
                    member.roles.cache
                        .toJSON()
                        .sort((a, b) => b.comparePositionTo(a))
                        .slice(0, -1)
                        .map((x) => x.toString())
                        .join(", ") || "(none)",
            },
            {
                name: "Permissions",
                value:
                    member.permissions
                        .toArray()
                        .map((x) => `\`${x}\``)
                        .join(", ") || "(none)",
            },
            user.flags && user.flags.toArray().length > 0
                ? {
                      name: "User Flags",
                      value: user.flags.toArray().join(", "),
                  }
                : [],
        ].flat(),
    };
}

export async function user_info(cmd, user) {
    return {
        title: `User info for ${user.tag}`,
        description: user.bot ? "**This user is a bot.**" : "",
        color: user.accentColor,
        thumbnail: {
            url: user.displayAvatarURL({ dynamic: true }),
        },
        fields: [
            {
                name: "ID",
                value: `\`${user.id}\``,
            },
            {
                name: "Created At",
                value: timestamp(user.createdAt),
            },
            (await has_permission("history", cmd.member))
                ? {
                      name: "Ban Status",
                      value: await (async () => {
                          try {
                              await cmd.guild.bans.fetch(user.id);
                              return "This user is banned from this server.";
                          } catch {
                              return "This user is not banned from this server.";
                          }
                      })(),
                  }
                : [],
            user.flags && user.flags.toArray().length > 0
                ? {
                      name: "User Flags",
                      value: user.flags.toArray().join(", "),
                  }
                : [],
        ].flat(),
    };
}
