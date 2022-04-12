import { Event } from "paimon.js";
import client from "../client.js";
import { get_setting } from "../lib/settings.js";
import { add_xp } from "../lib/xp.js";

export const module = "xp";

export const event = [
    new Event({
        event: "messageCreate",

        async run(message) {
            if (!message.author) return;
            if (!message.guild) return;
            if (message.guild.id != client.home.id) return;
            if (message.author.bot) return;

            await record_text_xp(message.author.id);
        },
    }),

    new Event({
        event: "voiceStateUpdate",

        async run(before, after) {
            if (!after.guild) return;
            if (after.guild.id != client.home.id) return;
            if (after.member.user.bot) return;

            await voice_xp_change(before, after);
        },
    }),
];

client.onHome(async (home) => {
    for (const state of home.voiceStates.cache.values()) {
        await voice_xp_change(null, state);
    }
});

const last_message = new Map();
const last_voice_update = new Map();
const voice_states = new Map();

async function record_text_xp(user_id) {
    let delay;

    const max_delay = (await get_setting("xp-delay")) ?? 120;
    const now = new Date();

    if (!last_message.has(user_id)) {
        delay = max_delay ?? 120;
    } else {
        delay = Math.min(
            (now - last_message.get(user_id)) / 1000,
            max_delay ?? 120
        );
    }

    last_message.set(user_id, now);

    const multiplier = max_delay == 0 ? 1 : delay / max_delay;

    await add_xp(
        user_id,
        multiplier * ((await get_setting("max-xp-per-message")) ?? 10),
        0
    );
}

async function voice_xp_change(_, after) {
    const user_id = after.member.id;

    if (after.channel) {
        if (voice_states.has(user_id)) return;
        last_voice_update.set(user_id, new Date());
        voice_states.set(
            user_id,
            setInterval(() => {
                last_voice_update.set(user_id, new Date());
                add_xp(user_id, 0, 5);
            }, 60000)
        );
    } else {
        if (!voice_states.has(user_id)) return;
        clearInterval(voice_states.get(user_id));
        voice_states.delete(user_id);
        if (last_voice_update.has(user_id)) {
            add_xp(
                user_id,
                0,
                (new Date() - last_voice_update.get(user_id)) / 12000
            );
            last_voice_update.delete(user_id);
        }
    }
}
