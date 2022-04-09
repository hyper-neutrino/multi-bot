import { Command } from "paimon.js";
import { create_poll } from "../lib/polls.js";
import { get_setting } from "../lib/settings.js";

export const module = "polls";

export const command = [
    new Command({
        name: "poll yes-no",
        description: "Post a yes/no poll.",
        options: ["s:question the poll question"],
        async execute(cmd, question) {
            const message = await cmd.reply({
                embeds: [
                    {
                        title: "Poll",
                        description: question,
                        fields: [
                            {
                                name: "Results",
                                value: "⬆️ 0 ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0 ⬇️",
                            },
                        ],
                        color: await get_setting("embed-color"),
                    },
                ],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "SUCCESS",
                                customId: "poll.yes",
                                emoji: "⬆️",
                            },
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "poll.abstain",
                                emoji: "🚫",
                            },
                            {
                                type: "BUTTON",
                                style: "DANGER",
                                customId: "poll.no",
                                emoji: "⬇️",
                            },
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "poll.close",
                                label: "CLOSE",
                            },
                        ],
                    },
                ],
                fetchReply: true,
            });

            await create_poll(message, ["yes", "no"], "yes/no");
        },
        permission: "poll",
    }),

    new Command({
        name: "poll select",
        description: "Post a selection poll.",
        options: ["s:question the poll question", "s:option1 option #1"].concat(
            [2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                (option) => `s:option${option}* option #${option}`
            )
        ),
        async execute(cmd, question, ...options) {
            options = options.filter((option) => option);

            if (new Set(options).size != options.length) {
                return "Poll options must be unique.";
            }

            const message = await cmd.reply({
                embeds: [
                    {
                        title: "Poll",
                        description: question,
                        fields: [
                            {
                                name: "Results",
                                value: options
                                    .map(
                                        (option) => `${option} - 0 / 0 (0.00%)`
                                    )
                                    .join("\n"),
                            },
                        ],
                        color: await get_setting("embed-color"),
                    },
                ],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "SELECT_MENU",
                                customId: `poll.vote`,
                                options: options.map((option, index) => ({
                                    label: option,
                                    value: option,
                                    emoji: [
                                        "🇦",
                                        "🇧",
                                        "🇨",
                                        "🇩",
                                        "🇪",
                                        "🇫",
                                        "🇬",
                                        "🇭",
                                        "🇮",
                                        "🇯",
                                    ][index],
                                })),
                            },
                        ],
                    },
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "poll.abstain",
                                emoji: "🚫",
                            },
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "poll.close",
                                label: "CLOSE",
                            },
                        ],
                    },
                ],
                fetchReply: true,
            });

            await create_poll(message, options, "select");
        },
        permission: "poll",
    }),
];
