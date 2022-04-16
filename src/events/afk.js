import { Event } from "paimon.js";
import client from "../client.js";
import { afk_is_ignored, clear_afk, get_afk } from "../lib/afk.js";

export const module = "afk";

export const event = new Event({
    event: "messageCreate",

    async run(message) {
        if (message.guild?.id != client.home.id) return;
        if (await afk_is_ignored(message.channel.id)) return;

        const afk = await get_afk(message.author.id);

        if (afk && new Date() - afk.time > 15000) {
            await clear_afk(message.member);

            const response = await message.reply(
                "Welcome back! I have removed your AFK status."
            );

            setTimeout(async () => {
                try {
                    await response.delete();
                } catch {}
            }, 4000);
        }

        const rows = [];

        for (const member of message.mentions.members.values()) {
            if (member.id == message.author.id) continue;

            const status = await get_afk(member.id);
            if (!status) continue;

            rows.push(
                `${member.user.tag} is AFK${
                    status.message == "AFK" ? "" : `: ${status.message}`
                } - <t:${Math.floor(status.time.getTime() / 1000)}:R>`
            );
        }

        if (rows.length > 0) {
            await message.reply({
                content: rows.join("\n"),
                allowedMentions: { parse: [] },
            });
        }
    },
});
