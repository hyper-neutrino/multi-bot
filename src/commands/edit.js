import { MessageCommand } from "paimon.js";
import client from "../client.js";
import { copy_attachments } from "../lib/message_utils.js";
import { post_modal } from "../lib/modals.js";

export default new MessageCommand({
    name: "Edit",
    async execute(cmd, message) {
        let webhook;

        if (message.author.id != client.user.id) {
            if (message.webhookId) {
                const webhooks = await cmd.guild.fetchWebhooks();
                webhook = webhooks.get(message.webhookId);

                if (!webhook) {
                    return "I could not gain control of the webhook that sent that message.";
                }
            } else {
                return "That message does not belong to me and is not a webhook message, so I cannot edit it.";
            }
        }

        const object = {};

        if (message.content) object.content = message.content;
        if (message.embeds.length > 0) object.embeds = message.embeds;

        if (message.components.length > 0) {
            object.components = message.components;
        }

        if (message.attachments.size > 0) {
            object.files = await copy_attachments(message, 0);
        }

        const data = JSON.stringify(object);

        if (data.length > 4000) {
            return "The message length is too long to fit within a modal.";
        }

        if (webhook) await webhook.edit({ channel: message.channel });

        const modal = await post_modal(cmd, {
            title: "Edit Message",
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            style: 2,
                            custom_id: "edit.data",
                            label: "Message Data",
                            value: data,
                        },
                    ],
                },
            ],
        });

        let edited;
        try {
            edited = JSON.parse(modal.data.components[0].components[0].value);
        } catch {
            await modal.respond({ content: "Invalid JSON.", flags: 64 });
            return;
        }

        edited.content ??= null;
        edited.embeds ??= [];
        edited.components ??= [];
        edited.files ??= [];

        try {
            if (webhook) await webhook.editMessage(message, edited);
            else await message.edit(edited);
        } catch {
            await modal.respond({ content: "Failed to edit.", flags: 64 });
            return;
        }

        await modal.respond({
            content: `Edited <${message.url}>.`,
            flags: 64,
        });
    },
    permission: "send",
});
