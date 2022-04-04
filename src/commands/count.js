import { Command } from "paimon.js";
import {
    get_counter,
    get_counter_score,
    get_counter_scoreboard,
    rm_counter,
    set_counter,
} from "../lib/count.js";
import { expand } from "../lib/format.js";
import { pagify } from "../lib/pages.js";
import { get_setting } from "../lib/settings.js";

export default [
    new Command({
        name: "count create",
        description: "Initialize a count channel.",
        options: [
            "c:channel:text,news,newsthread,privatethread,publicthread the count channel",
        ],
        async execute(_, channel) {
            if (await get_counter(channel.id)) {
                return "That is already a count channel.";
            }

            await set_counter(channel.id, 1);

            return [
                `${channel} is now a count channel.`,
                `+ count channel: ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "count delete",
        description: "Destroy a count channel.",
        options: [
            "c:channel:text,news,newsthread,privatethread,publicthread the count channel to remove",
        ],
        async execute(_, channel) {
            if (!(await get_counter(channel.id))) {
                return "That is not a count channel.";
            }

            await rm_counter(channel.id);

            return [
                `${channel} is no longer a count channel.`,
                `- count channel: ${expand(channel)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "count set",
        description: "Set the counter for a count channel.",
        options: [
            "c:channel:text,news,newsthread,privatethread,publicthread the count channel to edit",
            "i:count the number to set (the next one required)",
        ],
        async execute(_, channel, count) {
            if (!(await get_counter(channel.id))) {
                return "That is not a count channel.";
            }

            await set_counter(channel.id, count);

            await channel.send(
                `The counter has been set to \`${
                    count - 1
                }\`; the next expected message should be \`${count}\`.`
            );

            return [
                `${channel}'s counter has been set to \`${count}\`.`,
                `= count channel: ${expand(channel)} → \`${count}\``,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "count score",
        description: "Look at your (or another user's) counter score.",
        options: ["u:user* the user to check (default yourself)"],
        async execute(cmd, user) {
            user ??= cmd.user;

            const score = await get_counter_score(user.id);

            await cmd.reply({
                embeds: [
                    {
                        title: "Counter Score",
                        description: `${user} (${user.tag})'s score is ${score}.`,
                        color: await get_setting("embed-color"),
                    },
                ],
            });
        },
        permission: "@everyone",
    }),

    new Command({
        name: "count scoreboard",
        description: "View the counter scoreboard.",
        options: [],
        async execute(cmd) {
            const scoreboard = await get_counter_scoreboard();
            if (scoreboard.length == 0) return "The scoreboard is empty!";

            scoreboard.sort((a, b) => b.score - a.score);

            let index = 0;
            const messages = [];
            const color = await get_setting("embed-color");

            while (scoreboard.length > 0) {
                messages.push({
                    embeds: [
                        {
                            title: "Counter Scoreboard",
                            description: scoreboard
                                .splice(0, 20)
                                .map(
                                    ({ user_id, score }) =>
                                        `\`${++index}.\` <@${user_id}> - \`${score}\``
                                )
                                .join("\n"),
                            color,
                        },
                    ],
                });
            }

            await pagify(cmd, messages);
        },
        permission: "@everyone",
    }),
];
