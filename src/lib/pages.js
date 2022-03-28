export async function pagify(interaction, embeds, ephemeral) {
    if (embeds.length == 0) {
        return await interaction.reply({
            content: "Attempted to return pages, but there was nothing found.",
            ephemeral,
        });
    }

    if (embeds.length == 1) {
        return await interaction.reply({ embeds, ephemeral });
    }

    let page = 0;

    embeds.forEach(
        (embed, index) =>
            (embed.footer = { text: `Page ${index + 1} / ${embeds.length}` })
    );

    const message = await interaction.reply({
        embeds: [embeds[0]],
        components: [
            {
                type: "ACTION_ROW",
                components: [
                    ["⏪", "pages.first", "SECONDARY"],
                    ["◀️", "pages.left", "SECONDARY"],
                    ["🛑", "pages.stop", "DANGER"],
                    ["▶️", "pages.right", "SECONDARY"],
                    ["⏩", "pages.last", "SECONDARY"],
                ].map(([emoji, customId, style]) => ({
                    type: "BUTTON",
                    style,
                    customId,
                    emoji,
                })),
            },
        ],
        ephemeral,
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        filter: (click) => click.user.id == interaction.user.id,
        time: 900000 - 10000,
    });

    collector.on("collect", async (click) => {
        switch (click.customId) {
            case "pages.first":
                page = 0;
                break;
            case "pages.left":
                page = (page + embeds.length - 1) % embeds.length;
                break;
            case "pages.right":
                page = (page + 1) % embeds.length;
                break;
            case "pages.last":
                page = embeds.length - 1;
                break;
            case "pages.stop":
                await click.update({ components: [] });
                collector.stop();
                return;
        }
        await click.update({ embeds: [embeds[page]] });
    });

    collector.on("end", async (collected) => {
        try {
            await message.edit({ components: [] });
        } catch {}
    });
}
