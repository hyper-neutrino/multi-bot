import { Command } from "paimon.js";

export default new Command({
    name: "help",
    description: "Get help on the bot or a specific feature.",
    options: ["s:key!* what to get help on"],
    async execute(interaction, key) {
        return `Help in ${interaction.guild} for \`${key}\`.`;
    },
    async autocomplete(_, query) {
        return ["TODO"].filter((item) => item.match(query));
    },
});
