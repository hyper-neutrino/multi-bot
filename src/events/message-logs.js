import { Event } from "paimon.js";
import client from "../client.js";
import { expand, timestamp } from "../lib/format.js";
import { copy_attachments } from "../lib/message_utils.js";
import { get_setting_channel } from "../lib/settings.js";
import { get_webhook } from "../lib/webhooks.js";
import { is_loggable, is_logger_ignoring } from "../lib/message-logs.js";
import { create_gist } from "../lib/gist.js";

export const module = "logs";

export const event = [
    new Event({
        event: "messageUpdate",

        async run(before, after) {
            if (!(await is_loggable(after))) return;
            if (before.content == after.content) return;

            const hook = await get_hook(after.channel);
            if (!hook) return;

            console.log({
                embeds: [
                    {
                        title: "Message Edited",
                        color: "GOLD",
                        url: after.url,
                        fields: [
                            {
                                name: "Before",
                                value: before.content.substring(0, 1024),
                            },
                            {
                                name: "After",
                                value: after.content.substring(0, 1024),
                            },
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
                avatarURL: (after.member ?? after.author)?.displayAvatarURL({
                    dynamic: true,
                }),
            });

            await hook.send({
                embeds: [
                    {
                        title: "Message Edited",
                        color: "GOLD",
                        url: after.url,
                        fields: [
                            {
                                name: "Before",
                                value: before.content.substring(0, 1024),
                            },
                            {
                                name: "After",
                                value: after.content.substring(0, 1024),
                            },
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
                avatarURL: (after.member ?? after.author)?.displayAvatarURL({
                    dynamic: true,
                }),
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

    new Event({
        event: "voiceStateUpdate",

        async run(before, after) {
            if (after.guild.id != client.home.id) return;

            const user = after.author;
            if (user.bot) return;

            const c1 = before.channel;
            const c2 = after.channel;

            if ((c1 && c1.id) == (c2 && c2.id)) return;

            const logs = await get_setting_channel("logs.message");
            if (!logs) return;

            if (!c1) {
                await logs.send({
                    embeds: [
                        {
                            title: `${user.tag} joined a voice channel`,
                            description: `${expand(user)} joined ${expand(
                                c2
                            )}.`,
                            color: "GREEN",
                        },
                    ],
                });
            } else if (!c2) {
                await logs.send({
                    embeds: [
                        {
                            title: `${user.tag} left a voice channel`,
                            description: `${expand(user)} left ${expand(c1)}.`,
                            color: "RED",
                        },
                    ],
                });
            } else {
                await logs.send({
                    embeds: [
                        {
                            title: `${user.tag} switched voice channels`,
                            description: `${expand(user)} moved from ${expand(
                                c1
                            )} to ${expand(c2)}`,
                            color: "GOLD",
                        },
                    ],
                });
            }
        },
    }),
];

async function log_delete(message, hook) {
    if (!(await is_loggable(message, false, true))) return;

    if (!hook) hook = await get_hook(message.channel);
    if (!hook) return;

    const files = await copy_attachments(message, 1);

    console.log({
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
        avatarURL: (message.member ?? message.author)?.displayAvatarURL({
            dynamic: true,
        }),
    });

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
        avatarURL: (message.member ?? message.author)?.displayAvatarURL({
            dynamic: true,
        }),
    });
}

export async function log_delete_bulk(messages) {
    const hook = await get_hook(messages[0].channel);
    for (const message of messages) await log_delete(message, hook);

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

async function get_hook(channel) {
    if (!client.all_commands.has("message-logs")) return undefined;

    do {
        try {
            const override = await get_setting_channel(
                `log-override.${channel.id}`
            );
            if (override) return override;
        } catch {}
    } while ((channel = channel.parent));

    const logs = await get_setting_channel("logs.message");
    if (!logs) return undefined;

    return await get_webhook(logs, "message-logs");
}
