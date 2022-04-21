import { Event } from "paimon.js";
import client from "../client.js";
import { get_counter, increment_counter } from "../lib/count.js";

export const module = "count";

export const event = [
    new Event({
        event: "messageCreate",

        async run(message) {
            if (
                message.author.id == client.user.id &&
                (message.content.startsWith("The counter has been set to") ||
                    message.content.match(/^<@!?\d+>: \d+/))
            )
                return;

            const counter = await get_counter(message.channel.id);
            if (!counter) return;

            if (
                counter.count.toString() != message.content ||
                !message.author ||
                message.attachments.size != 0 ||
                counter.user_id == message.author.id
            ) {
                try {
                    await message.delete();
                } catch {}

                return;
            }

            await increment_counter(message.channel.id, message.author.id);
            last = message.id;
        },
    }),

    new Event({
        event: "messageUpdate",
        async run(_, message) {
            await check_broken(message);
        },
    }),

    new Event({
        event: "messageDelete",
        run: check_broken,
    }),
];

let last = "";

async function check_broken(message) {
    const counter = await get_counter(message.channel.id);
    if (!counter) return;

    if (message.id == last) {
        try {
            await message.delete();
        } catch {}

        const repeat = await message.channel.send({
            content: `${message.author}: ${counter.count - 1}`,
            allowedMentions: { repliedUser: false },
        });

        last = repeat.id;
    }
}
