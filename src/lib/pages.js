export async function pagify(interaction, messages, ephemeral, edit, initial) {
    const reply = (edit ? interaction.editReply : interaction.reply).bind(
        interaction
    );

    if (messages.length == 0) {
        return await reply({
            content: "Attempted to return pages, but there was nothing found.",
            ephemeral,
        });
    }

    if (messages.length == 1) {
        return await reply({ ...messages[0], ephemeral });
    }

    let page = initial ?? 0;

    messages.forEach((message, index) => {
        if ((message.embeds ?? []).length > 0) {
            message.embeds[message.embeds.length - 1].footer = {
                text: `Page ${index + 1} / ${messages.length}`,
            };
        }
    });

    const message = await reply({
        ...messages[Math.min(initial, messages.length - 1)],
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
        await click.deferUpdate({ ephemeral });
        switch (click.customId) {
            case "pages.first":
                page = 0;
                break;
            case "pages.left":
                page = (page + messages.length - 1) % messages.length;
                break;
            case "pages.right":
                page = (page + 1) % messages.length;
                break;
            case "pages.last":
                page = messages.length - 1;
                break;
            case "pages.stop":
                await click.editReply({ components: [] });
                collector.stop();
                return;
        }
        await click.editReply(messages[page]);
    });

    collector.on("end", async () => {
        try {
            await message.edit({ components: [] });
        } catch {}
    });
}
