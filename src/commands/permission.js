import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import {
    add_permission,
    autocomplete,
    clear_permission,
    get_permission,
    rm_permission,
} from "../lib/permissions.js";
import { fetch_snowflake } from "../lib/utils.js";

export const command = [
    new Command({
        name: "permission grant",
        description: "Grant a permission to a user or role.",
        options: [
            "s:key! the permission to grant",
            "p:target the user/role to give permission to",
        ],
        async execute(_, key, target) {
            await add_permission(key, target.id);
            return [
                `Granted permission \`${key}\` to ${target}.`,
                `+ permission \`${key}\` → ${expand(target)}`,
            ];
        },
        autocomplete,
        permission: "permission",
    }),

    new Command({
        name: "permission deny",
        description: "Deny a permission from a user or role.",
        options: [
            "s:key! the permission to deny",
            "p:target the user/role to take permission from",
        ],
        async execute(_, key, target) {
            await rm_permission(key, target.id);
            return [
                `Removed permission \`${key}\` from ${target}.`,
                `- permission \`${key}\` ← ${expand(target)}`,
            ];
        },
        autocomplete,
        permission: "permission",
    }),

    new Command({
        name: "permission reset",
        description:
            "Reset a permission, removing it from all users and roles.",
        options: ["s:key! the permission to reset"],
        async execute(_, key) {
            await clear_permission(key);
            return [
                `Reset permission \`${key}\` for everyone.`,
                `× permission \`${key}\` reset`,
            ];
        },
        autocomplete,
        permission: "permission",
    }),

    new Command({
        name: "permission view",
        description: "View users/roles who have a certain permission.",
        options: ["s:key! the permission to check"],
        async execute(cmd, key) {
            const snowflakes = await get_permission(key);
            const strings = [];
            for (const snowflake of snowflakes) {
                const item = await fetch_snowflake(cmd.guild, snowflake);
                if (item) strings.push(item);
            }
            return strings.join(", ") || "(none)";
        },
        autocomplete,
        permission: "@everyone",
    }),
];
