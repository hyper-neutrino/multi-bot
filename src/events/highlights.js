import { Event } from "paimon.js";
import { timestamp } from "../lib/format.js";
import { get_highlighting_users, get_highlights } from "../lib/highlights.js";
import { stem } from "../lib/natural.js";
import { get_setting } from "../lib/settings.js";

const last_ping = new Map();
const cooldown = 300000;

function can_ping(channel, user) {
    const key = `${channel.id}/${user.id}`;
    if (!last_ping.has(key)) return true;
    return new Date() - last_ping.get(key) >= cooldown;
}

function apply_ping(channel, user) {
    const key = `${channel.id}/${user.id}`;
    last_ping.set(key, new Date());
}

export default new Event({
    event: "messageCreate",

    async run(message) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.channel) return;
        if (!message.channel.members) return;

        apply_ping(message.channel, message.author);

        const members = [];
        const normalized = " " + stem(message.content).join(" ") + " ";

        for (const user_id of await get_highlighting_users()) {
            if (message.author.id == user_id) continue;
            if (!can_ping(message.channel, { id: user_id })) continue;

            let member;

            try {
                member = await message.guild.members.fetch(user_id);
            } catch {
                continue;
            }

            if (!message.channel.permissionsFor(member).has("VIEW_CHANNEL")) {
                continue;
            }

            for (const { term } of await get_highlights(user_id)) {
                if (normalized.indexOf(" " + term + " ") != -1) {
                    members.push(member);
                    break;
                }
            }
        }

        if (members.length == 0) return;

        const cache = message.channel.messages.cache;
        const messages = [];

        for (let x = -5; x < 0; ++x) {
            const m = cache.at(x);
            if (!m) continue;
            messages.push(
                `[${timestamp(m.createdAt)}] ${
                    m.author.tag ?? "Unknown User"
                }: ${m.content}`
            );
        }

        const context = messages.join("\n");
        const obj = {
            embeds: [
                {
                    title: "Highlighted Term",
                    description: `One of your highlights triggered in ${message.channel}:`,
                    fields: [
                        {
                            name: "Context",
                            value: context,
                        },
                        {
                            name: "Source",
                            value: `[Jump!](${message.url})`,
                        },
                    ],
                    color: await get_setting("embed-color"),
                    url: message.url,
                },
            ],
        };

        for (const member of members) {
            try {
                await member.send(obj);
            } catch {}
            apply_ping(message.channel, member);
        }
    },
});
