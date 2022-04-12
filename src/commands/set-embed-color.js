import { Command } from "paimon.js";
import { set_setting } from "../lib/settings.js";

export const command = new Command({
    name: "set-embed-color",
    description: "Set the default color for embeds from this bot.",
    options: ["s:color the color"],
    async execute(cmd, color) {
        color = color.toUpperCase();

        try {
            await cmd.reply({
                embeds: [
                    {
                        title: "Set the color",
                        description: "This embed has the new color.",
                        color,
                    },
                ],
            });

            await set_setting("embed-color", color);

            await cmd.log(`= embed-color: \`${color}\``);
        } catch (error) {
            console.error(error.stack || error);
            return "That is not a valid color.";
        }
    },
});
