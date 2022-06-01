import { Command } from "paimon.js";

export const command = new Command({
    name: "say",
    description: "Say a message (as a regular message).",
    options: [
        "s:string what to say",
        "b:ping* whether or not to send pings (default false)",
    ],
    async execute(cmd, string, ping) {
        ping ??= false;

        await cmd.channel.send({
            content: string,
            allowedMentions: ping ? undefined : { parse: [] },
        });

        return "Sent!";
    },
    permission: "send",
});
