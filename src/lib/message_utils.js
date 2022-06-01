import client from "../client.js";

export async function copy_attachments(message, spoiler_level) {
    const attachments = [];

    for (const attachment of message.attachments.values()) {
        let name = attachment.name;
        const spoiler = name.startsWith("SPOILER_");
        while (name.startsWith("SPOILER_")) name = name.substring(8);
        if ((spoiler_level == 0 && spoiler) || spoiler_level > 0) {
            name = "SPOILER_" + name;
        }
        attachments.push({ attachment: attachment.url, name });
    }

    for (const sticker of message.stickers.values()) {
        if (attachments.length >= 10) break;

        const path = await client.stickerCache.fetch(sticker);
        if (path) {
            attachments.push({
                attachment: path,
                name: `${spoiler_level > 0 ? "SPOILER_" : ""}${
                    sticker.name
                }.${client.stickerCache.ext(sticker)}`,
            });
        }
    }

    return attachments;
}
