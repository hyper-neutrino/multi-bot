import { Command } from "paimon.js";
import { expand } from "../lib/format.js";

export default [
    new Command({
        name: "slowmode",
        description: "Set a channel's slowmode (in seconds).",
        options: [
            "c:channel:text,news,newsthread,publicthread,privatethread the channel to set",
            "i:delay:0-21600 the slowmode delay (in seconds)",
        ],
        async execute(cmd, channel, delay) {
            await channel.setRateLimitPerUser(
                delay,
                `slowmode set by ${cmd.user.tag} (${cmd.user.id})`
            );

            return [
                `Set ${channel}'s slowmode to ${delay}s.`,
                `= slowmode: ${expand(channel)} → ${delay}`,
            ];
        },
        permission: "slowmode",
    }),
];
