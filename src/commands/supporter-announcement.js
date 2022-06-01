import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import {
    link_supporter_role,
    unlink_supporter_role,
} from "../lib/supporter-announcements.js";

export const command = [
    new Command({
        name: "supporter-announcement set",
        description:
            "Link a role as a supporter role and set its announcement.",
        options: [
            "r:role the role to link",
            "s:message the message data (as JSON)",
        ],
        async execute(_, role, data) {
            try {
                await link_supporter_role(role.id, JSON.parse(data));
            } catch {
                return "Invalid JSON.";
            }

            return [
                `Set supporter role announcement for ${role}.`,
                `* link supporter: ${expand(role)}`,
            ];
        },
        permission: "setting",
    }),

    new Command({
        name: "supporter-announcement delete",
        description:
            "Remove a role from being a supporter role, removing its announcement.",
        options: ["r:role the role to unlink"],
        async execute(_, role) {
            await unlink_supporter_role(role.id);

            return [
                `Removed supporter announcement for ${role}.`,
                `- unlink supporter: ${expand(role)}`,
            ];
        },
        permission: "setting",
    }),
];
