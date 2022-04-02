import { Event } from "paimon.js";
import client from "../client.js";
import { get_autoroles, set_autoroles } from "../lib/autoroles.js";
import { get_setting_role } from "../lib/settings.js";

export default [
    new Event({
        event: "guildMemberRemove",

        async run(member) {
            await set_autoroles(
                member.id,
                member.roles.cache
                    .toJSON()
                    .filter(
                        (role) =>
                            !role.tags.botId &&
                            !role.tags.integrationId &&
                            !role.tags.premiumSubscriberRole
                    )
                    .map((role) => role.id)
            );
        },
    }),

    new Event({
        event: "guildMemberAdd",

        async run(member) {
            if (!client.commands.has("autoroles")) return;
            const roles = [];
            const cutoff = await get_setting_role("autorole-threshold");
            for (const role_id of await get_autoroles(member.id)) {
                try {
                    const role = await member.guild.roles.fetch(role_id);
                    if (!cutoff || role.comparePositionTo(cutoff) < 0) {
                        roles.push(role);
                    }
                } catch {}
            }
            await member.roles.set(roles, "setting roles for returning user");
        },
    }),
];
