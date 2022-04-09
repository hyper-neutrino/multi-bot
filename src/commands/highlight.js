import { Command } from "paimon.js";
import {
    add_highlight,
    get_highlights,
    is_highlighted,
    rm_highlight,
} from "../lib/highlights.js";
import { stem } from "../lib/natural.js";
import { pagify } from "../lib/pages.js";
import { get_setting } from "../lib/settings.js";

export const module = "highlights";

export const command = [
    new Command({
        name: "highlight add",
        description: "Add a term to your highlights.",
        options: ["s:term the term to highlight"],
        async execute(cmd, original) {
            const term = stem(original).join(" ");

            if (term.length < 2 || term.length > 50) {
                return "Please highlight a term between 2 and 50 characters (after reducing to word roots).";
            }

            if (await is_highlighted(cmd.user.id, term)) {
                return `\`${original}\` is already highlighted (as word roots: \`${term}\`)`;
            }

            await add_highlight(cmd.user.id, term);

            return `\`${original}\` is now highlighted for you (as word roots: \`${term}\`).`;
        },
        permission: "highlight",
    }),

    new Command({
        name: "highlight remove",
        description: "Remove a term from your highlights.",
        options: ["s:term the term to remove from highlights"],
        async execute(cmd, original) {
            const term = stem(original).join(" ");

            if (!(await is_highlighted(cmd.user.id, term))) {
                return `\`${original}\` is not currently highlighted for you.`;
            }

            await rm_highlight(cmd.user.id, term);

            return `\`${original}\` is no longer highlighted for you.`;
        },
        permission: "highlight",
    }),

    new Command({
        name: "highlight list",
        description: "Show your current highlights.",
        options: [],
        async execute(cmd) {
            const terms = await get_highlights(cmd.user.id);

            let index = 0;
            const fields = terms.map(({ term }) => ({
                name: `**#${++index}**`,
                value: `\`${term}\``,
                inline: true,
            }));
            const messages = [];
            const color = await get_setting("embed-color");

            while (fields.length > 0) {
                messages.push({
                    embeds: [
                        {
                            title: "Your Highlights",
                            color,
                            fields: fields.splice(0, 12),
                        },
                    ],
                });
            }

            await pagify(cmd, messages, true);
        },
        permission: "highlight",
    }),
];
