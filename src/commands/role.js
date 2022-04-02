import { Command } from "paimon.js";
import { expand } from "../lib/format.js";

export default [
    new Command({
        name: "role add",
        description: "Grant a role to a member.",
        options: ["m:member the member", "r:role the role"],
        async execute(cmd, member, role) {
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
