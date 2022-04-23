import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { set_setting } from "../lib/settings.js";

const choices = [
    ["Command Audit Logs", "command"],
    ["Message Logs", "message"],
    ["Admin chat (for crucial alerts)", "admin-chat"],
    ["Watchlist (for automod actions and reports)", "watchlist"],
    ["Supporter Announcement (for boosters and other supporters)", "supporter"],
    ["Welcome Channel (for new members)", "welcome"],
    ["Suggestions (/suggest)", "suggestions"],
];

export const command = [
    new Command({
        name: "log set",
        description: "Set the logging channel.",
        options: [
            ["s:key the log type to set", ...choices],
            "c:channel:text,news,newsthread,privatethread,publicthread the channel to set",
        ],
        async execute(_, key, channel) {
            await set_setting(`logs.${key}`, channel.id);
            return [
                `Set log channel \`${key}\` to ${channel}.`,
                `= log channel \`${key}\` → ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "log unset",
        description: "Unset a logging channel.",
        options: [["s:key the log type to unset", ...choices]],
        async execute(_, key) {
            await set_setting(`logs.${key}`, undefined);
            return [
                `Unset log channel \`${key}\`.`,
                `- log channel \`${key}\` → undefined`,
            ];
        },
        permission: "setting",
    }),
];
