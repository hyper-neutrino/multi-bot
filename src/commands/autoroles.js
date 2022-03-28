import { Command } from "paimon.js";
import { add_autorole, get_autoroles, rm_autorole } from "../lib/autoroles.js";
import { expand } from "../lib/format.js";
import { get_setting_role, set_setting } from "../lib/settings.js";

export default [
    new Command({
        name: "autoroles threshold set",
        description:
            "Set the autorole cutoff (lowest role that cannot be returned).",
        options: ["r:role the threshold (this role will be blocked)"],
        async execute(_, role) {
            await set_setting("autorole-threshold", role.id);
            return [
                `Roles above or equal to ${role} will no longer be returned when a user rejoins the server.`,
                `= autorole threshold → ${expand(role)}`,
            ];
        },
        permission: "autoroles",
    }),

    new Command({
        name: "autoroles view",
        description: "Show the list of roles saved for a user if they return.",
        options: ["u:user the user to show"],
        async execute(cmd, user) {
            const allowed = [],
                denied = [];
            const cutoff = await get_setting_role("autorole-threshold");
            for (const role_id of await get_autoroles(user.id)) {
                try {
                    const role = await cmd.guild.roles.fetch(role_id);
                    if (cutoff && role.comparePositionTo(cutoff) >= 0) {
                        denied.push(role);
                    } else {
                        allowed.push(role);
                    }
                } catch {}
            }
            return `✅ ${allowed.join(", ") || "(none)"}\n❌ ${
                denied.join(", ") || "(none)"
            }`;
        },
        permission: "autoroles",
    }),

    new Command({
        name: "autoroles add",
        description: "Add a role to a user's list of roles for if they return.",
        options: ["u:user the user to alter", "r:role the role to add"],
        async execute(_, user, role) {
            await add_autorole(user.id, role.id);
            return [
                `Added ${role} to ${user}'s autoroles.`,
                `+ autoroles: ${expand(user)} ← ${expand(role)}`,
            ];
        },
        permission: "autoroles",
    }),

    new Command({
        name: "autoroles remove",
        description:
            "Remove a role from a user's list of roles for if they return.",
        options: ["u:user the user to alter", "r:role the role to remove"],
        async execute(_, user, role) {
            await rm_autorole(user.id, role.id);
            return [
                `Removed ${role} from ${user}'s autoroles.`,
                `- autoroles: ${expand(user)} × ${expand(role)}`,
            ];
        },
        permission: "autoroles",
    }),
];
