import { Command } from "paimon.js";
import { bind_channel, unbind_channel } from "../lib/stats-channels.js";
import { expand } from "../lib/format.js";

export const command = [
    new Command({
        name: "stats-channel set",
        description: "Set a channel to be a stats channel.",
        options: [
            "c:channel the channel to bind",
            "s:format the format of the channel name",
        ],
        async execute(_, channel, format) {
            await bind_channel(channel.id, format);

            return [
                `Bound ${channel} to follow the format \`${format}\`.`,
                `= stats-channel: ${expand(channel)} ← \`${format}\``,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "stats-channels unbind",
        description: "Remove a stats channel (does not delete the channel).",
        options: ["c:channel the channel to unbind"],
        async execute(_, channel) {
            await unbind_channel(channel.id);

            return [
                `Unbound ${channel}; its name will no longer be automatically updated.`,
                `- stats-channels: ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),
];
