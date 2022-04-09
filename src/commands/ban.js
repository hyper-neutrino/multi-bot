import { Command } from "paimon.js";
import {
    b2e,
    DM_STATUSES,
    expand,
    parse_duration,
    pluralize,
    unparse_duration,
} from "../lib/format.js";
import ban from "../moderation/ban.js";
import { link_origin, mod_fail } from "../moderation/utils.js";

export const module = "moderation";

export const command = new Command({
    name: "ban",
    description: "Ban a user.",
    options: [
        "u:user the user to ban",
        's:duration* how long to ban for (or "forever", default forever)',
        "s:reason* the reason for the ban (DM'd and logged)",
        "b:dm* whether or not to DM the user (default true)",
        "i:days*:0-7 the number of days of messages to delete (default 0)",
    ],
    async execute(cmd, user, duration, reason, dm, days) {
        duration = parse_duration(duration ?? "forever");
        reason ??= "";
        dm ??= true;
        days ??= 0;

        if (reason.length > 1000) {
            return "Please keep the reason within 1000 characters.";
        }

        const fail = await mod_fail(cmd.member, user);
        if (fail) return fail;

        const response = await cmd.confirm({
            title: `Banning ${user.tag} ${unparse_duration(duration)} ${
                dm ? "with DM" : "without DM"
            } ${
                days ? `deleting ${days} day${pluralize(days)} of messages` : ""
            }`,
            color: "AQUA",
            fields: reason ? [{ name: "Reason", value: reason }] : [],
        });

        if (!response) return;

        const [status, id] = await ban(
            cmd.member,
            user,
            reason,
            dm,
            duration,
            days
        );

        const message = await response.update({
            embeds: [
                {
                    title: `Banned ${user.tag} (#${id})`,
                    description: `${user} was banned ${unparse_duration(
                        duration
                    )} ${DM_STATUSES[status]}.`,
                    color: status == 2 ? "GOLD" : "GREEN",
                    fields: [
                        reason ? [{ name: "Reason", value: reason }] : [],
                        days
                            ? [
                                  {
                                      name: "Days",
                                      value: `Deleted ${days} day${pluralize(
                                          days
                                      )} of messages.`,
                                  },
                              ]
                            : [],
                    ].flat(),
                },
            ],
            components: [],
            fetchReply: true,
        });

        await cmd.log(
            `Banned ${expand(user)}; dm: ${b2e(
                dm
            )}; duration: ${unparse_duration(
                duration
            )}; days: ${days}; reason: ${reason}`
        );

        await link_origin(id, message.url);
    },
    permission: "ban",
});
