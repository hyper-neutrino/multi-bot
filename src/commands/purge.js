import { Command, is_string, MessageCommand } from "paimon.js";
import { log_delete_bulk, purge_log_skip } from "../events/message-logs.js";
import { expand } from "../lib/format.js";
import { is_loggable, is_logger_ignoring } from "../lib/message-logs.js";
import { parse_message_link } from "../lib/utils.js";

export const module = "moderation";

export const command = [
    new Command({
        name: "purge last",
        description: "Purge the last N (2 - 100) messages.",
        options: ["i:count:2-100 number of messages"],
        async execute(cmd, count) {
            await cmd.deferReply({ ephemeral: true });
            await purge(
                cmd,
                cmd.channel,
                (await cmd.channel.messages.fetch({ limit: count })).toJSON()
            );
        },
        permission: "purge",
    }),

    new Command({
        name: "purge between",
        description:
            "Purge between two messages (must be in the same channel).",
        options: [
            "s:first first message to purge (link)",
            "s:last last message to purge (link)",
        ],
        async execute(cmd, first, last) {
            first = await parse_message_link(first);
            last = await parse_message_link(last);

            return await purge_between(cmd, first, last);
        },
        permission: "purge-more",
    }),

    new MessageCommand({
        name: "Purge Start",
        async execute(cmd, message) {
            let fail;

            if (end_markers.has(cmd.user.id)) {
                const marker = end_markers.get(cmd.user.id);
                if (new Date() - marker.time < 60000) {
                    fail = await purge_between(cmd, message, marker.item);
                    if (!fail) {
                        start_markers.delete(cmd.user.id);
                        end_markers.delete(cmd.user.id);
                        return;
                    }
                }
            }

            start_markers.set(cmd.user.id, { time: new Date(), item: message });

            return `${fail ? `Purge failed: ${fail} ` : ""}Marked <${
                message.url
            }> as the first message to purge.`;
        },
        permission: "purge-more",
    }),

    new MessageCommand({
        name: "Purge End",
        async execute(cmd, message) {
            let fail;

            if (start_markers.has(cmd.user.id)) {
                const marker = start_markers.get(cmd.user.id);
                if (new Date() - marker.time < 60000) {
                    fail = await purge_between(cmd, marker.item, message);
                    if (!fail) {
                        start_markers.delete(cmd.user.id);
                        end_markers.delete(cmd.user.id);
                        return;
                    }
                }
            }

            end_markers.set(cmd.user.id, { time: new Date(), item: message });

            return `${fail ? `Purge failed: ${fail} ` : ""}Marked <${
                message.url
            }> as the last message to purge.`;
        },
        permission: "purge-more",
    }),
];

const start_markers = new Map();
const end_markers = new Map();

async function messages_between(cmd, first, last) {
    if (!first || !last) {
        return `Could not find the ${
            first ? "last" : last ? "first" : "first or last"
        } message; please make sure it is a valid message link and that I can see the message.`;
    }

    if (first.createdAt > last.createdAt) {
        return "Your target messages are in the wrong order.";
    }

    if (first.id == last.id) {
        return "Cannot purge 1 message.";
    }

    if (first.channel.id != last.channel.id) {
        return "Your target messages must be in the same channel.";
    }

    await cmd.deferReply({ ephemeral: true });

    let head = first;
    let keep_going = true;
    const messages = [first];

    while (keep_going) {
        const block = await first.channel.messages.fetch({
            after: head.id,
            limit: 100,
        });

        for (const message of block.values()) {
            if (message.createdAt >= last.createdAt) keep_going = false;
            if (message.createdAt > head.createdAt) head = message;
            if (message.createdAt <= last.createdAt) {
                messages.push(message);
            }
        }
    }

    messages.sort((a, b) => b.createdAt - a.createdAt);

    return messages;
}

async function purge_between(cmd, first, last) {
    const messages = await messages_between(cmd, first, last);
    if (is_string(messages)) return messages;

    await purge(cmd, first.channel, messages);
}

async function purge(cmd, channel, messages) {
    const response = await cmd.confirm(
        {
            title: `Purging ${messages.length} messages`,
            description: `[first](${
                messages[messages.length - 1].url
            }) - [last](${messages[0].url})`,
            color: "AQUA",
        },
        { edit: true }
    );

    if (!response) return;

    await cmd.editReply({
        embeds: [
            {
                title: `Purging ${messages.length} messages.`,
                description: "This may take a while; please be patient.",
                color: "GOLD",
            },
        ],
    });

    await response.deferUpdate({ ephemeral: true });

    const ids = new Set(messages.map((message) => message.id));

    const to_log = [];
    const skip = await is_logger_ignoring(channel);

    if (!skip) for (const id of ids) purge_log_skip.add(id);

    let count = 0;

    while (messages.length > 0) {
        const deleted = await channel.bulkDelete(messages.splice(0, 100), true);
        for (const message of deleted.values()) {
            ++count;
            ids.delete(message.id);
            if (!skip && (await is_loggable(message, true, true))) {
                to_log.push(message);
            }
        }
    }

    for (const id of ids) {
        try {
            const message = await channel.messages.fetch(id);
            await message.delete();
            ++count;
            if (!skip && (await is_loggable(message, true, true))) {
                to_log.push(message);
            }
        } catch {}
    }

    to_log.sort((a, b) => a.createdAt - b.createdAt);

    if (to_log.length > 0) await log_delete_bulk(to_log);

    await response.editReply({
        embeds: [
            {
                title: `Purged ${count} messages.`,
                description: `${count} messages were purged from ${channel}.`,
                color: "GREEN",
            },
        ],
        components: [],
    });

    await cmd.log(`×× purged ${count} messages from ${expand(channel)}`);
}
