import { Command } from "paimon.js";
import {
    add_logger_ignore,
    list_logger_ignore,
    rm_logger_ignore,
} from "../lib/message-logs.js";

export default [
    new Command({
        name: "message-logs ignore add",
        description:
            "Add a category, channel, or thread to be ignored by the message logger.",
        options: ["c:channel the channel to ignore"],
        async execute(_, channel) {
            await add_logger_ignore(channel.id);
            return [
                `Messages in ${channel} will be ignored by the message logger.`,
                `+ logger-ignore; ${expand(channel)}`,
            ];
        },
        permission: "message-logs",
    }),

    new Command({
        name: "message-logs ignore remove",
        description:
            "Set a category, channel, or thread to be watched by the message logger.",
        options: ["c:channel the channel to unignore"],
        async execute(_, channel) {
            await rm_logger_ignore(channel.id);
            return [
                `Edits and deletions in ${channel} will now be scanned by the message logger.`,
                `- logger-ignore; ${expand(channel)}`,
            ];
        },
        permission: "message-logs",
    }),

    new Command({
        name: "message-logs ignore list",
        description: "Show all of the message logger's ignored channels.",
        options: [],
        async execute(_) {
            return `Message logger ignores: ${
                (await list_logger_ignore())
                    .map((entry) => `<#${entry.channel_id}>`)
                    .join(", ") || "(none)"
            }`;
        },
        permission: "message-logs",
    }),
];
