import { Command } from "paimon.js";
import {
    b2e,
    DM_STATUSES,
    expand,
    parse_duration,
    unparse_duration,
} from "../lib/format.js";
import { get_setting_role } from "../lib/settings.js";
import mute from "../moderation/mute.js";
import { link_origin, mod_fail } from "../moderation/utils.js";

export default new Command({
    name: "mute",
    description: "Mute a user.",
    options: [
        "u:user the user to mute",
        's:duration* how long to mute for (or "forever", default forever)',
        "s:reason* the reason for the mute (DM'd and logged)",
        "b:dm* whether or not to DM the user (default true)",
    ],
    async execute(cmd, user, duration, reason, dm) {
        if (!(await get_setting_role("mute"))) {
            return "The mute role is not set yet; please ask an admin to configure it.";
        }

        duration = parse_duration(duration ?? "forever");
        reason ??= "";
        dm ??= true;

        if (reason.length > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        const fail = await mod_fail(cmd.member, user);
        if (fail) return fail;

        const response = await cmd.confirm({
            title: `Muting ${user.tag} ${unparse_duration(duration)} ${
                dm ? "with DM" : "without DM"
            }`,
            color: "AQUA",
            fields: reason ? [{ name: "Reason", value: reason }] : [],
        });

        if (!response) return;

        const [status, id] = await mute(cmd.member, user, reason, dm, duration);

        const message = await response.update({
            embeds: [
                {
                    title: `Muted ${user.tag} (#${id})`,
                    description: `${user} was muted ${unparse_duration(
                        duration
                    )} ${DM_STATUSES[status]}.`,
                    color: status == 2 ? "GOLD" : "GREEN",
                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                },
            ],
            components: [],
            fetchReply: true,
        });

        await cmd.log(
            `Muted ${expand(user)}; dm: ${b2e(
                dm
            )}; duration: ${unparse_duration(duration)}; reason: ${reason}`
        );

        await link_origin(id, message.url);
    },
    permission: "mute",
});
