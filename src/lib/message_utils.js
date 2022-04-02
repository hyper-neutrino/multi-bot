export function copy_attachments(message, spoiler_level) {
    const attachments = [];
    for (const attachment of message.attachments.toJSON()) {
        let name = attachment.name;
        const spoiler = name.startsWith("SPOILER_");
        while (name.startsWith("SPOILER_")) name = name.substring(8);
        if ((spoiler_level == 0 && spoiler) || spoiler_level > 0) {
            name = "SPOILER_" + name;
        }
        attachments.push({ attachment: attachment.url, name });
    }
    return attachments;
}
