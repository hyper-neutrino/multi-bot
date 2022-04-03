import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { set_setting } from "../lib/settings.js";

export default [
    new Command({
        name: "starboard default set",
        description: "Set the default starboard channel.",
        options: [
            "c:channel:text,news,newsthread,privatethread,publicthread the starboard channel",
        ],
        async execute(_, channel) {
            await set_setting("starboard.default", channel.id);

            return [
                `Set the default starboard to ${channel}.`,
                `= starboard: default → ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "starboard default remove",
        description: "Remove the default starboard.",
        options: [],
        async execute(_) {
            await set_setting("starboard.default", "0");

            return [
                `Removed the default starboard.`,
                `- starboard: default → null`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "starboard set",
        description: "Set a starboard for a category / channel.",
        options: [
            "c:source the source channel",
            "c:starboard:text,news,newsthread,privatethread,publicthread the starboard for this source channel",
        ],
        async execute(_, source, starboard) {
            await set_setting(`starboard.${source.id}`, starboard.id);

            return [
                `Set the starboard for ${source} to ${starboard}`,
                `= starboard: ${expand(source)} → ${expand(starboard)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "starboard block",
        description: "Prevent a category / channel from being starred.",
        options: ["c:channel the source channel"],
        async execute(_, channel) {
            await set_setting(`starboard.${channel.id}`, "0");

            return [
                `Blocked the starboard for ${channel}.`,
                `× starboard: ${expand(channel)} → blocked`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "starboard revert",
        description:
            "Revert a category / channel to point to the default starboard.",
        options: ["c:channel the source channel"],
        async execute(_, channel) {
            await set_setting(`starboard.${channel.id}`, undefined);

            return [
                `Reverted the starboard for ${channel} to th default starboard.`,
                `- starboard: ${expand(channel)} → default`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "starboard threshold set",
        description: "Set the starboard's threshold (default 5).",
        options: [
            "c:starboard:text,news,newsthread,privatethread,publicthread the starboard (not the source channel)",
            "i:count:1- the minimum number of stars required",
        ],
        async execute(_, starboard, count) {
            await set_setting(`star-threshold.${starboard.id}`, count);

            return [
                `Set the threshold for ${starboard} to ${count}.`,
                `= starboard-threshold: ${expand(starboard)} → \`count\``,
            ];
        },
        permission: "setting",
    }),
];
