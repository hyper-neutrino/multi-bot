import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { has_permission } from "../lib/permissions.js";

export const command = [
    new Command({
        name: "role add",
        description: "Grant a role to a member.",
        options: ["m:member the member", "r:role the role"],
        async execute(cmd, member, role) {
            if (
                cmd.member.roles.highest.comparePositionTo(role) < 0 &&
                !(await has_permission("role-admin", cmd.member))
            ) {
                return "You cannot grant that role as it is above your highest role.";
            }

            try {
                await member.roles.add(
                    role,
                    `added by command by ${cmd.user.tag} (${cmd.user.id})`
                );
            } catch {
                return `I could not give ${role} to ${member}. I might be missing permissions.`;
            }

            return [
                `Granted ${role} to ${member}.`,
                `+ role: ${expand(role)} → ${expand(member)}`,
            ];
        },
        permission: "role",
    }),

    new Command({
        name: "role remove",
        description: "Remove a role from a member.",
        options: ["m:member the member", "r:role the role"],
        async execute(cmd, member, role) {
            if (
                cmd.member.roles.highest.comparePositionTo(role) < 0 &&
                !(await has_permission("role-admin", cmd.member))
            ) {
                return "You cannot remove that role as it is above your highest role.";
            }

            try {
                await member.roles.remove(
                    role,
                    `removed by command by ${cmd.user.tag} (${cmd.user.id})`
                );
            } catch {
                return `I could not take ${role} from ${member}. I might be missing permissions.`;
            }

            return [
                `Removed ${role} from ${member}.`,
                `- role: ${expand(role)} ← ${expand(member)}`,
            ];
        },
        permission: "role",
    }),
];
