import { Command } from "paimon.js";
import { get_setting } from "../lib/settings.js";

export const module = "fun";

export const command = [
    new Command({
        name: "choose",
        description: "Randomly choose one of up to 10 options.",
        options: ["s:choice-1 choice #1"].concat(
            [2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                (choice) => `s:choice-${choice}* choice #${choice}`
            )
        ),
        async execute(cmd, ...choices) {
            choices = choices.filter((choice) => choice);

            await cmd.reply({
                embeds: [
                    {
                        title: "Random Choice",
                        description:
                            choices[Math.floor(Math.random() * choices.length)],
                        color: await get_setting("embed-color"),
                    },
                ],
            });
        },
    }),
];
