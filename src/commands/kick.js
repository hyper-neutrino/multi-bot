import { Command } from "paimon.js";
import { b2e, DM_STATUSES, expand } from "../lib/format.js";
import kick from "../moderation/kick.js";
import { link_origin, mod_fail } from "../moderation/utils.js";

export const module = "moderation";

export const command = new Command({
    name: "kick",
    description: "Kick a member.",
    options: [
        "m:member the member to kick (must be in the server)",
        "s:reason* the reason for the kick (DM'd and logged)",
        "b:dm* whether or not to DM the user (default true)",
    ],
    async execute(cmd, member, reason, dm) {
        reason ??= "";
        dm ??= true;

        if (reason > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        const fail = await mod_fail(cmd.member, member);
        if (fail) return fail;

        const response = await cmd.confirm({
            title: `Kicking ${member.user.tag} ${
                dm ? "with DM" : "without DM"
            }`,
            color: "AQUA",
            fields: reason ? [{ name: "Reason", value: reason }] : [],
        });

        if (!response) return;

        const [status, id] = await kick(cmd.member, member, reason, dm);

        const message = await response.update({
            embeds: [
                {
                    title: `Kicked ${member.user.tag} (#${id})`,
                    description: `${member} was kicked ${DM_STATUSES[status]}.`,
                    color: status == 2 ? "GOLD" : "GREEN",
                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                },
            ],
            components: [],
            fetchReply: true,
        });

        await cmd.log(
            `Kicked ${expand(member.user)}; dm: ${b2e(dm)}; reason: ${reason}`
        );

        await link_origin(id, message.url);
    },
    permission: "kick",
});
