import { Event } from "paimon.js";
import { get_suggestion, suggestion_vote } from "../lib/suggestions.js";

export default new Event({
    event: "interactionCreate",

    async run(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith("suggestion.")) return;

        await suggestion_vote(
            interaction.message.id,
            interaction.user.id,
            interaction.customId.endsWith("yes")
        );

        const { yes, no } = await get_suggestion(interaction.message.id);

        const components = interaction.message.components;

        components[0].components[0].label = yes.length.toString();
        components[0].components[1].label = no.length.toString();

        await interaction.update({ components });
    },
});
