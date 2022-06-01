import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import unban from "../moderation/unban.js";
import { reason_fields } from "../moderation/utils.js";

export const module = "moderation";

export const command = new Command({
    name: "unban",
    description: "Unban a user.",
    options: [
        "u:user the user to unban",
        "s:reason* the reason for the unban (only in command logs)",
    ],
    async execute(cmd, user, reason) {
        reason ??= "";

        if (reason.length > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        try {
            await unban(cmd.member, user, reason);
        } catch {
            return "I could not ban this user; they probably do not exist or are not banned.";
        }

        await cmd.reply({
            embeds: [
                {
                    title: `Unbanned ${user.tag}`,
                    description: `${user} was unbanned. DMs are not attempted for unbans.`,
                    color: "GREEN",
                    fields: await reason_fields(reason),
                },
            ],
        });

        await cmd.log(`Unbanned ${expand(user)}; reason: ${reason}`);
    },
    permission: "ban",
});
