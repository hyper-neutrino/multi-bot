import { Command } from "paimon.js";
import {
    get_stick_content,
    get_stick_message,
    link_stick,
    set_stick,
    unstick,
} from "../lib/sticky-messages.js";

export const command = [
    new Command({
        name: "stick",
        description: "Set this channel's sticky message.",
        options: ["s:message the text to stick"],
        async execute(cmd, content) {
            const old = await get_stick_message(cmd.channel);
            if (old) await old.delete();

            const message = await cmd.channel.send(content);

            await set_stick(cmd.channel.id, content);
            await link_stick(cmd.channel.id, message.id);

            return "Sticky message set.";
        },
        permission: "sticky",
    }),

    new Command({
        name: "stick-stop",
        description: "Stop this channel's sticky message.",
        options: [],
        async execute(cmd) {
            if (!(await get_stick_content(cmd.channel))) {
                return "This channel does not have a sticky message.";
            }

            const old = await get_stick_message(cmd.channel);
            if (old) await old.delete();

            await unstick(cmd.channel.id);

            return "Stick message removed.";
        },
        permission: "sticky",
    }),
];
