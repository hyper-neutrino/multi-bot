import { Command } from "paimon.js";
import { b2e, DM_STATUSES, expand } from "../lib/format.js";
import { get_setting_role } from "../lib/settings.js";
import unmute from "../moderation/unmute.js";
import { reason_fields } from "../moderation/utils.js";

export const module = "moderation";

export const command = new Command({
    name: "unmute",
    description: "Unmute a user.",
    options: [
        "u:user the user to unmute",
        "s:reason* the reason for the unmute (DM'd and in command logs)",
        "b:dm* whether or not to DM the user (default true)",
    ],
    async execute(cmd, user, reason, dm) {
        if (!(await get_setting_role("mute"))) {
            return "The mute role is not set yet; please ask an admin to configure it.";
        }

        reason ??= "";
        dm ??= true;

        if (reason.length > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        const status = await unmute(cmd.member, user, reason, dm);

        await cmd.reply({
            embeds: [
                {
                    title: `Unmuted ${user.tag}`,
                    description: `${user} was unmuted ${DM_STATUSES[status]}`,
                    color: status == 2 ? "GOLD" : "GREEN",
                    fields: await reason_fields(reason),
                },
            ],
        });

        await cmd.log(
            `Unmuted ${expand(user)}; dm: ${b2e(dm)}; reason: ${reason}`
        );
    },
    permission: "mute",
});
