import { Event } from "paimon.js";
import client from "../client.js";
import { expand, timestamp } from "../lib/format.js";
import { copy_attachments } from "../lib/message_utils.js";
import { get_setting_channel } from "../lib/settings.js";
import { get_webhook } from "../lib/webhooks.js";
import { diffWords } from "diff";
import XRegExp from "xregexp";
import { is_loggable, is_logger_ignoring } from "../lib/message-logs.js";
import { create_gist } from "../lib/gist.js";

// regexes taken from leaf:
// https://github.com/Teyvat-Collective-Network/relay-bot/blob/6a1ec9746b0af8248e681d46e6816b8116c7b3dc/events/messageUpdate.js#L9
// leaf op

const escape_regex = XRegExp("(?<!\\\\)((?:\\\\\\\\)*)([\\[\\]\\(\\)*~_`])");
const trim_regex = /^(\s*)(.*?)(\s*)$/;

export default [
    new Event({
        event: "messageUpdate",

        async run(before, after) {
            if (!(await is_loggable(after))) return;
            if (before.content == after.content) return;

            const hook = await get_hook();
            if (!hook) return;

            await hook.send({
                embeds: [
                    {
                        title: "Message Edited",
                        description: diffWords(before.content, after.content)
                            .map((block) => {
                                const text = block.value;
                                if (block.added) {
                                    return text
                                        .replace(escape_regex, "$1\\$2")
                                        .replace(trim_regex, "$1**$2**$3");
                                } else if (block.removed) {
                                    return text
                                        .replace(escape_regex, "$1\\$2")
                                        .replace(trim_regex, "$1~~$2~~$3");
                                } else {
                                    return (
                                        text.length > 32
                                            ? `${text.substring(
                                                  0,
                                                  16
                                              )}...${text.substring(
                                                  text.length - 16
                                              )}`
                                            : text
                                    ).replace(escape_regex, "$1\\$2");
                                }
                            })
                            .join(""),
                        color: "GOLD",
                        url: after.url,
                        fields: [
                            {
                                name: "Author",
                                value: expand(after.author),
                                inline: true,
                            },
                            {
                                name: "Channel",
                                value: expand(after.channel),
                                inline: true,
                            },
                        ],
                        timestamp: after.createdTimestamp,
                    },
                ],
                username: after.author.username,
                avatarURL: after.member.displayAvatarURL({ dynamic: true }),
            });
        },
    }),

    new Event({
        event: "messageDelete",

        run: log_delete,
    }),

    new Event({
        event: "messageDeleteBulk",

        async run(messages) {
            if (await is_logger_ignoring(messages.first().channel)) return;

            if (messages.some((message) => purge_log_skip.has(message.id))) {
                return;
            }

            const list = [];
            for (const message of messages.toJSON().reverse()) {
                if (!(await is_loggable(message, true))) continue;
                list.push(message);
            }

            await log_delete_bulk(list);
        },
    }),
];

async function log_delete(message) {
    if (!(await is_loggable(message, false, true))) return;

    const hook = await get_hook();
    if (!hook) return;

    const files = await copy_attachments(message, 1);

    await hook.send({
        embeds: [
            {
                title: "Message Deleted",
                description: message.content,
                color: "RED",
                url: message.url,
                fields: (message.reference
                    ? [
                          {
                              name: "Reference",
                              value: `https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}`,
                          },
                      ]
                    : []
                ).concat([
                    {
                        name: "Author",
                        value: expand(message.author),
                        inline: true,
                    },
                    {
                        name: "Channel",
                        value: expand(message.channel),
                        inline: true,
                    },
                ]),
                timestamp: message.createdTimestamp,
            },
        ],
        files,
        username: message.author.username,
        avatarURL: message.member.displayAvatarURL({ dynamic: true }),
    });
}

export async function log_delete_bulk(messages) {
    for (const message of messages) await log_delete(message);
    if (messages.length <= 1) return;

    const rows = [];
    for (const message of messages) {
        rows.push([
            message.createdAt.toISOString(),
            " [",
            message.author.tag,
            " ",
            message.author.id,
            "] ",
            `${message.content}`,
        ]);

        for (const file of message.attachments.values()) {
            rows.push(["", "", "", "", "", "", file.url]);
        }

        for (const sticker of message.stickers.values()) {
            const path = await client.stickerCache.fetch(sticker);
            if (path) {
                rows.push(["", "", "", "", "", "", `[sticker] ${path}`]);
            }
        }
    }

    for (let col = 0; col < rows[0].length - 1; ++col) {
        let min_width = 0;

        for (const row of rows) {
            min_width = Math.max(min_width, row[col].length);
        }

        for (const row of rows) {
            row[col] += " ".repeat(min_width - row[col].length);
        }
    }

    const now = new Date();
    const url = await create_gist(
        `purge-${now.getTime()}.txt`,
        `Purged messages from ${now.toDateString()} in channel #${
            messages[0].channel.name
        } (${messages[0].channel.id})`,
        rows.map((row) => row.join(" ").trimEnd()).join("\n")
    );

    console.log(`[Purge] purged messages logged at ${url}`);

    const logs = await get_setting_channel("logs.message");
    if (!logs) return;
    await logs.send({
        embeds: [
            {
                title: "Messages Purged",
                description: `Messages between ${timestamp(
                    messages[0].createdAt
                )} and ${timestamp(
                    messages[messages.length - 1].createdAt
                )} were purged from ${expand(
                    messages[0].channel
                )}. View the logs [here](${url})`,
                color: "PURPLE",
                url,
            },
        ],
    });
}

export const purge_log_skip = new Set();

async function get_hook() {
    if (!client.all_commands.has("message-logs")) return undefined;

    const logs = await get_setting_channel("logs.message");
    if (!logs) return undefined;

    return await get_webhook(logs, "message-logs");
}
