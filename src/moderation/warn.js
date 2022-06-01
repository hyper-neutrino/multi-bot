import db from "../db.js";
import { next_id } from "../lib/dbutils.js";
import { b2e, DM_STATUSES, expand } from "../lib/format.js";
import { get_setting } from "../lib/settings.js";
import { link_origin, mod_fail } from "./utils.js";

export function do_warn(log) {
    return async function (cmd, user, reason, dm) {
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
    };
}

export default async function warn(mod, user, reason, log, dm) {
    let id;

    if (log) {
        id = await next_id("history");
        await db.history.insertOne({
            id,
            user_id: user.id,
            type: "warn",
            time: new Date(),
            mod: mod.id,
            reason,
        });
    }

    if (dm) {
        try {
            await user.send({
                embeds: [
                    {
                        title: `Warning from: ${mod.guild}`,
                        description: `You were **warned** in ${mod.guild}.${
                            log
                                ? ""
                                : " This will **not** be put on your record."
                        }`,
                        color: await get_setting("embed-color"),
                        fields: [{ name: "Reason", value: reason }],
                        footer: {
                            text: "You can respond to this message to contact staff.",
                        },
                    },
                ],
            });
            return [1, id];
        } catch {
            return [2, id];
        }
    } else return [0, id];
}
