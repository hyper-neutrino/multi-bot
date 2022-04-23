import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import {
    add_logger_ignore,
    list_logger_ignore,
    rm_logger_ignore,
} from "../lib/message-logs.js";
import { set_setting } from "../lib/settings.js";

export const module = "logs";

export const command = [
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
        permission: "setting",
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
        permission: "setting",
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
        permission: "setting",
    }),

    new Command({
        name: "message-logs override set",
        description:
            "Set the message logging channel for a specific source channel.",
        options: [
            "c:source the source channel",
            "c:log:text,news,newsthread,privatethread,publicthread the log channel",
        ],
        async execute(_, source, log) {
            await set_setting(`log-override.${source.id}`, log.id);

            return [
                `Message logs for ${source} will now go to ${log}.`,
                `= logger-override: ${expand(source)} → ${expand(log)}`,
            ];
        },
    }),

    new Command({
        name: "message-logs override clear",
        description:
            "Clear the message log channel override and return to the normal log channel.",
        options: ["c:source the source channel to clear"],
        async execute(_, source) {
            await set_setting(`log-override.${source.id}`, undefined);

            return [
                `Message logs for ${source} will go to the default now.`,
                `- logger-override: ${expand(source)}`,
            ];
        },
    }),
];
