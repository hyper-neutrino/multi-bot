import { Event } from "paimon.js";
import { has_permission } from "../lib/permissions.js";
import {
    get_poll_type,
    get_poll_votes,
    set_poll_vote,
    unset_poll_vote,
} from "../lib/polls.js";

export default new Event({
    event: "interactionCreate",

    async run(interaction) {
        if (!interaction.customId.startsWith("poll.")) return;

        const cmd = interaction.customId.substring(5);

        if (cmd == "open" || cmd == "close") {
            if (!(await has_permission("poll", interaction.member))) {
                await interaction.reply({
                    content: "You do not have permission to manage polls.",
                    ephemeral: true,
                });
                return;
            }

            const components = interaction.message.components;

            for (const row of components) {
                for (const item of row.components) {
                    if (item.customId == "poll.open") {
                        item.customId = "poll.close";
                        item.label = "CLOSE";
                    } else if (item.customId == "poll.close") {
                        item.customId = "poll.open";
                        item.label = "OPEN";
                    } else {
                        item.disabled = cmd == "close";
                    }
                }
            }

            await interaction.update({ components });
            return;
        } else if (cmd == "yes") {
            await set_poll_vote(interaction.message, interaction.user, "yes");
        } else if (cmd == "no") {
            await set_poll_vote(interaction.message, interaction.user, "no");
        } else if (cmd == "vote") {
            await set_poll_vote(
                interaction.message,
                interaction.user,
                interaction.values[0]
            );
        } else if (cmd == "abstain") {
            await unset_poll_vote(interaction.message, interaction.user);
        }

        let value;
        const type = await get_poll_type(interaction.message);
        const options = await get_poll_votes(interaction.message);

        if (type == "yes/no") {
            const { yes, no } = options;
            const green = Math.floor((10 * yes) / (yes + no || 1));
            value = `⬆️ ${yes} ${
                yes + no > 0
                    ? "🟩".repeat(green) + "🟥".repeat(10 - green)
                    : "⬜".repeat(10)
            } ${no} ⬇️`;
        } else if (type == "select") {
            const choices = Object.keys(options).map((option) => [
                options[option],
                option,
            ]);

            let sum = 0;
            for (const [count, _] of choices) sum += count;

            value = choices
                .map(([a, b]) => [-a, b])
                .sort()
                .map(([a, b]) => [-a, b])
                .map(
                    ([count, option]) =>
                        `${option} - ${count} / ${sum} (${(
                            (count / sum) *
                            100
                        ).toFixed(2)}%)`
                )
                .join("\n");
        }

        const embeds = interaction.message.embeds;
        embeds[0].fields[0].value = value;

        await interaction.update({ embeds });
    },
});
