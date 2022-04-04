import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { copy_attachments } from "../lib/message_utils.js";
import { get_setting, set_setting } from "../lib/settings.js";
import { parse_message_link } from "../lib/utils.js";

export default [
    new Command({
        name: "clone",
        description: "Clone a message exactly.",
        options: [
            "s:link the message link",
            "c:channel:text,news,newsthread,privatethread,publicthread the channel to send to",
        ],
        async execute(_, link, channel) {
            const message = await parse_message_link(link);
            if (!message) return "Could not fetch message.";

            await channel.send({
                content: message.content || null,
                embeds: message.embeds,
                components: message.components,
                files: await copy_attachments(message, 0),
            });

            return [
                "Posted.",
                `* clone: ${expand(message.channel)} → ${expand(channel)}`,
            ];
        },
        permission: "send",
    }),

    new Command({
        name: "webhook",
        description: "Set the server's webhook.",
        options: ["s:id the webhook ID or URL"],
        async execute(_, id) {
            if (id.match(/https:\/\/.*discord.com\/api\/webhooks/)) {
                id = id.split("/")[5];
            }
            await set_setting("main-webhook", id);
            return ["Set the main webhook.", `= main webhook → \`${id}\``];
        },
        permission: "webhook",
    }),

    new Command({
        name: "point",
        description: "Point the server's webhook to a new channel.",
        options: ["c:channel:text,news the channel to point to"],
        async execute(cmd, channel) {
            const webhooks = await cmd.guild.fetchWebhooks();
            const webhook = webhooks.get(await get_setting("main-webhook"));

            if (!webhook) {
                return "This server's webhook is not configured or no longer exists. Reconfigure it with `/webhook`.";
            }

            await webhook.edit({ channel });

            return webhook.url;
        },
        permission: "webhook",
    }),
];
