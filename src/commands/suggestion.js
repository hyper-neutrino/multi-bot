import { Command } from "paimon.js";
import client from "../client.js";
import { next_id } from "../lib/dbutils.js";
import { get_setting, get_setting_channel } from "../lib/settings.js";
import { create_suggestion, get_suggestion_by_id } from "../lib/suggestions.js";

export const module = "suggestions";

export const command = [
    new Command({
        name: "suggest",
        description: "Suggest a server change, feature, etc.",
        options: ["s:suggestion what you want to suggest"],
        async execute(cmd, suggestion) {
            const channel = await get_setting_channel("logs.suggestions");
            if (!channel) return "The suggestions channel is not configured.";

            const id = await next_id("suggestions");

            const message = await channel.send({
                embeds: [
                    {
                        title: `Suggestion #${id}`,
                        description: suggestion,
                        color: await get_setting("embed-color"),
                        author: {
                            name: cmd.user.tag,
                            iconURL: cmd.member.displayAvatarURL({
                                dynamic: true,
                            }),
                        },
                    },
                ],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "SUCCESS",
                                customId: "suggestion.yes",
                                emoji: "⬆️",
                                label: "0",
                            },
                            {
                                type: "BUTTON",
                                style: "DANGER",
                                customId: "suggestion.no",
                                emoji: "⬇️",
                                label: "0",
                            },
                        ],
                    },
                ],
            });

            await create_suggestion(message.id, cmd.user.id, id);

            return `Posted suggestion #${id} in ${channel}.`;
        },
        permission: "@everyone",
    }),

    new Command({
        name: "suggestion update",
        description: "Update a suggestion's status.",
        options: [
            "i:id:1- the ID of the suggestion",
            [
                "s:status the verdict on the suggestion",
                "Implemented",
                "Approved",
                "Considered",
                "Denied",
            ],
            "s:response* the response to include with the verdict",
            "b:anonymous* whether or not to hide your name (default false)",
            "b:dm* whether or not to DM the suggestion author (default true)",
        ],
        async execute(cmd, id, status, response, anonymous, dm) {
            const suggestion = await get_suggestion_by_id(id);
            if (!suggestion) return "There is no suggestion by that ID.";

            anonymous ??= false;
            dm ??= true;

            let message;
            try {
                message = await (
                    await get_setting_channel("logs.suggestions")
                ).messages.fetch(suggestion.message_id);
            } catch {
                return "I could not find the message for this suggestion in the suggestion channel, or the suggestion channel does not exist.";
            }

            await cmd.deferReply({ ephemeral: true });

            const embed = message.embeds[0];

            if (embed.fields.length == 0) embed.fields = [{}];

            embed.fields[0].name = `${status}${
                anonymous ? "" : ` by ${cmd.user.tag}`
            }`;

            embed.fields[0].value = response || "_ _";

            embed.color = color_map[status];

            await message.edit({ embeds: [embed] });

            let success = true;

            if (dm) {
                try {
                    const user = await client.users.fetch(suggestion.user_id);

                    await user.send({
                        embeds: [
                            {
                                title: `Your suggestion (#${
                                    suggestion.id
                                }) was ${status.toLowerCase()}${
                                    anonymous ? "" : ` by ${cmd.user.tag}`
                                }`,
                                description: `> ${embed.description}`,
                                color: color_map[status],
                                fields: response
                                    ? [{ name: "Response", value: response }]
                                    : [],
                                footer: {
                                    text: "Thanks for your feedback and suggestions!",
                                },
                            },
                        ],
                    });
                } catch {
                    await cmd.editReply(
                        "Updated the suggestion, but I could not DM the user."
                    );
                    success = false;
                }
            }

            if (success) await cmd.editReply("Updated the suggestion.");

            await cmd.log(
                `* update suggestion #${id} - ${status.toLowerCase()} - ${
                    dm ? (success ? "with DM" : "DM failed") : "without DM"
                }`
            );
        },
        permission: "suggestion",
    }),
];

const color_map = {
    Implemented: "GREEN",
    Approved: "AQUA",
    Considered: "GOLD",
    Denied: "RED",
};
