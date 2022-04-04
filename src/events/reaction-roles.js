import { Event } from "paimon.js";

export default new Event({
    event: "interactionCreate",

    async run(interaction) {
        if (!interaction.isButton() && !interaction.isSelectMenu()) return;

        if (interaction.customId.startsWith("role.")) {
            const id = interaction.customId.substring(5);

            if (interaction.member.roles.cache.has(id)) {
                await interaction.member.roles.remove(id);
                await interaction.reply({
                    content: `I have removed <@&${id}> from you.`,
                    ephemeral: true,
                });
            } else {
                await interaction.member.roles.add(id);
                await interaction.reply({
                    content: `I have given <@&${id}> to you.`,
                    ephemeral: true,
                });
            }

            return;
        }

        if (interaction.customId == "multi-role") {
            const add = new Set(interaction.values);
            const remove = new Set(
                interaction.message.components[0].components[0].options
                    .map((option) => option.value)
                    .filter((id) => interaction.member.roles.cache.has(id))
            );

            await interaction.member.roles.add(
                [...add].filter((x) => !remove.has(x))
            );

            await interaction.member.roles.remove(
                [...remove].filter((x) => !add.has(x))
            );

            await interaction.reply({
                content:
                    add.size > 0
                        ? `I have given ${[...add]
                              .map((id) => `<@&${id}>`)
                              .join(
                                  ", "
                              )} to you (and removed other roles that were not selected).`
                        : "I have removed the available roles from you.",
                ephemeral: true,
            });
        }
    },
});
