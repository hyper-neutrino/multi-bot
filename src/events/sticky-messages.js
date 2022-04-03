import { Event } from "paimon.js";
import client from "../client.js";
import {
    get_stick_content,
    get_stick_message,
    link_stick,
} from "../lib/sticky-messages.js";

export default new Event({
    event: "messageCreate",

    async run(message) {
        if (message.author.id == client.user.id) return;
        if (!message.guild) return;

        if (
            cooldown.has(message.channel.id) &&
            new Date() - cooldown.get(message.channel.id) < 2000
        ) {
            return;
        }

        cooldown.set(message.channel.id, new Date());

        const content = await get_stick_content(message.channel);
        if (!content) return;

        const old = await get_stick_message(message.channel);
        if (old) await old.delete();

        const sent = await message.channel.send(content);

        await link_stick(message.channel.id, sent.id);
    },
});

const cooldown = new Map();
