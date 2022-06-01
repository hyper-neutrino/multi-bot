import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { protect_channel, unprotect_channel } from "../lib/nukeguard.js";

export const module = "nukeguard";

export const command = [
    new Command({
        name: "nukeguard channel protect",
        description: "Protect a channel with nukeguard.",
        options: ["c:channel the channel to protect"],
        async execute(_, channel) {
            await protect_channel(channel.id);

            return [
                `${channel} is now protected.`,
                `+ protection ${expand(channel)}`,
            ];
        },
        permission: "nukeguard",
    }),

    new Command({
        name: "nukeguard channel unprotect",
        description: "Remove a channel's nukeguard protection.",
        options: ["c:channel the channel to unprotect"],
        async execute(_, channel) {
            await unprotect_channel(channel.id);

            return [
                `${channel} is no longer protected.`,
                `- protection ${expand(channel)}`,
            ];
        },
        permission: "nukeguard",
    }),
];
