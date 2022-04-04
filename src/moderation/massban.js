import db from "../db.js";
import { next_id } from "../lib/dbutils.js";
import { create_gist } from "../lib/gist.js";
import { link_origin } from "./utils.js";

export default async function (mod, id_list, reason, days, origin) {
    const success = [];
    const failure = [];

    for (const user_id of id_list) {
        try {
            await mod.guild.bans.create(user_id, {
                days,
                reason: reason.substring(0, 512),
            });

            success.push(user_id);
        } catch {
            failure_push(user_id);
        }

        try {
            const id = await next_id("history");

            await db.history.insertOne({
                id,
                user_id,
                type: "ban",
                time: new Date(),
                mod: mod.id,
                reason: "[massban] " + reason,
                duration: 0,
                url: origin,
            });
        } catch {}
    }

    const now = new Date();
    const ms = now.getTime();

    const success_url =
        success.length > 0
            ? await create_gist(
                  `massban-list-${ms}.txt`,
                  `Massban from ${mod.guild.name} on ${now.toDateString()}`,
                  success.join(" ")
              )
            : "(no IDs)";

    const failure_url =
        failure.length > 0
            ? await create_gist(
                  `massban-fail-list-${ms}.txt`,
                  `List of user IDs who were not able to be massbanned from ${
                      mod.guild.name
                  } on ${now.toDateString()}`,
                  failure.join(" ")
              )
            : "(no IDs)";

    return {
        embed: {
            title: "Massban",
            description: `\`Success:\` ${success.length}\n\`Failure:\` ${failure.length}`,
            color: 3066993,
            fields: [
                {
                    name: "Reason",
                    value: reason,
                },
                {
                    name: "Exported IDs",
                    value: `\`Success:\` ${success_url}\n\`Failure:\` ${failure_url}`,
                },
            ],
        },
        success_url,
        failure_url,
    };
}
