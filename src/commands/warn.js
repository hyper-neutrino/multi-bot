import { Command } from "paimon.js";
import { b2e, DM_STATUSES, expand } from "../lib/format.js";
import { link_origin, mod_fail } from "../moderation/utils.js";
import warn from "../moderation/warn.js";

export default new Command({
    name: "warn",
    description: "Warn a user.",
    options: [
        "u:user the user to warn",
        "s:reason the reason to include",
        "b:log true = formal warning; false = verbal warning",
        "b:dm* whether or not to DM the user (default true)",
    ],
    async execute(cmd, user, reason, log, dm) {
        if (reason.length > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        dm ??= true;

        if (!log && !dm) {
            return "If you don't log or DM this warning it doesn't actually do anything.";
        }

        const fail = await mod_fail(cmd.member, user);
        if (fail) return fail;

        const response = await cmd.confirm({
            title: `Warning ${user.tag}`,
            description: `${log ? "logged/formal" : "unlogged/verbal"} + ${
                dm ? "will send dm" : "will not send dm"
            }`,
            color: "AQUA",
            fields: [{ name: "Reason", value: reason }],
        });

        if (!response) return;

        const [status, id] = await warn(cmd.member, user, reason, log, dm);

        const message = await response.update({
            embeds: [
                {
                    title: `Warned ${user.tag}${log ? ` (#${id})` : ""}`,
                    description: `${user} was warned ${
                        DM_STATUSES[status]
                    }. This warning was ${log ? "" : "not "}logged.`,
                    color: status == 2 ? "GOLD" : "GREEN",
                    fields: [{ name: "Reason", value: reason }],
                },
            ],
            components: [],
            fetchReply: true,
        });

        await cmd.log(
            `Warned ${expand(user)}; log: ${b2e(log)}; dm: ${b2e(
                dm
            )}; reason: ${reason}`
        );

        if (log) await link_origin(id, message.url);
    },
    permission: "warn",
});
