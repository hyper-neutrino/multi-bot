import db from "../db.js";
import { tag_user, timestamp, unparse_duration } from "../lib/format.js";
import { pagify } from "../lib/pages.js";
import { get_setting } from "../lib/settings.js";

export default async function (cmd, user, filter, ephemeral) {
    const entries = await db.history
        .find({
            user_id: user.id,
            ...(filter ? { type: filter } : {}),
        })
        .toArray();

    if (entries.length == 0) {
        return await cmd.reply({
            embeds: [
                {
                    title: `User History: ${user.tag}`,
                    description: `${user}${
                        filter ? ` has no ${filter}s.` : "'s history is clean."
                    }`,
                    color: await get_setting("embed-color"),
                },
            ],
            ephemeral,
        });
    }

    const messages = [];

    while (entries.length > 0) {
        messages.push({
            embeds: [
                {
                    title: `User History: ${user.tag}`,
                    color: await get_setting("embed-color"),
                    fields: await Promise.all(
                        entries.splice(0, 7).map(async (entry) => ({
                            name: `${
                                entry.type.charAt(0).toUpperCase() +
                                entry.type.substring(1)
                            } #${entry.id}`,
                            value: `By <@${entry.mod}> (${await tag_user(
                                entry.mod
                            )}) on ${timestamp(entry.time)}${
                                entry.type == "mute" || entry.type == "ban"
                                    ? ` ${unparse_duration(
                                          entry.duration ?? 0
                                      )}`
                                    : ""
                            }${entry.url ? ` [here](${entry.url})` : ""}${
                                entry.reason && `\n\n${entry.reason}`
                            }`,
                        }))
                    ),
                },
            ],
        });
    }

    await pagify(cmd, messages, ephemeral);
}
