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
import { link_origin, mod_fail, reason_fields } from "../moderation/utils.js";

export const module = "moderation";

export const command = new Command({
    name: "timeout",
    description: "Timeout a user.",
    options: [
        "u:user the user to timeout",
        "s:duration* how long to timeout for (up to 28 days)",
        "s:reason* the reason for the timeout (DM'd and logged)",
        "b:dm* whether or not to DM the user (default true)",
    ],
    async execute(cmd, user, duration, reason, dm) {
        duration = parse_duration(duration ?? "forever");
        reason ??= "";
        dm ??= true;

        if (duration > 28 * 24 * 60 * 60 * 1000 || duration == 0) {
            return "You cannot timeout for more than 28 days.";
        }

        if (reason.length > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        const fail = await mod_fail(cmd.member, user);
        if (fail) return fail;

        const response = await cmd.confirm({
            title: `Timing out ${user.tag} ${unparse_duration(duration)} ${
                dm ? "with DM" : "without DM"
            }`,
            color: "AQUA",
            fields: await reason_fields(reason),
        });

        if (!response) return;

        const [status, id] = await mute(cmd.member, user, reason, dm, duration);

        const message = await response.update({
            embeds: [
                {
                    title: `Timed out ${user.tag} (#${id})`,
                    description: `${user} was timed out ${unparse_duration(
                        duration
                    )} ${DM_STATUSES[status]}.`,
                    color: status == 2 ? "GOLD" : "GREEN",
                    fields: await reason_fields(reason),
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
