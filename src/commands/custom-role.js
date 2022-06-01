import { Command } from "paimon.js";
import {
    destroy_custom_role,
    get_custom_role,
    has_custom_role,
} from "../lib/custom-roles.js";
import { expand } from "../lib/format.js";
import { set_setting } from "../lib/settings.js";

export const module = "custom-roles";

export const command = [
    new Command({
        name: "custom-role claim",
        description: "Claim a custom role.",
        options: [],
        async execute(cmd) {
            const stop = ratelimit(cmd);
            if (stop) return stop;

            if (await get_custom_role(cmd.member, false)) {
                return "You already have a custom role. If you wish to edit it, please use `/custom-role update`.";
            }

            await cmd.deferReply({ ephemeral: true });

            await get_custom_role(cmd.member, true);

            await cmd.editReply(
                "You now have a custom role! You can set its name and color with `/custom-role update`."
            );
        },
        permission: "custom-role",
    }),

    new Command({
        name: "custom-role update",
        description: "Update your custom role.",
        options: ["s:name* your new role name", "s:color* your new role color"],
        async execute(cmd, name, color) {
            const stop = ratelimit(cmd);
            if (stop) return stop;

            if (!(await has_custom_role(cmd.member))) {
                return "You don't have a custom role yet. You can claim one with `/custom-role claim`.";
            }

            const role = await get_custom_role(cmd.member, false);

            if (!role) {
                return "Your custom role is missing for some reason. You can fix this by re-claiming it with `/custom-role claim`.";
            }

            if (!name && !color) return "Nothing was changed.";

            try {
                await role.edit({
                    name: name || undefined,
                    color: (color && color.toUpperCase()) || undefined,
                });
            } catch {
                return "Role edit failed; please make sure your color is a valid hex code or discord.js color string.";
            }

            return `Your custom role was updated successfully.`;
        },
        permission: "custom-role",
    }),

    new Command({
        name: "custom-role destroy",
        description: "Get rid of your custom role.",
        options: [],
        async execute(cmd) {
            if (!(await has_custom_role(cmd.member))) {
                return "You don't have a custom role.";
            }

            await destroy_custom_role(cmd.member);

            return "Your custom role has been deleted; you can always reclaim one with `/custom-role claim`.";
        },
        permission: "custom-role",
    }),

    new Command({
        name: "custom-role anchor",
        description:
            "Set the anchor for custom roles (defines the role position).",
        options: ["r:role the anchor role"],
        async execute(cmd, role) {
            await set_setting("custom-role-anchor", role.id);

            return [
                `Set the custom role anchor to ${role}.`,
                `= custom-role-anchor → ${expand(role)}`,
            ];
        },
        permission: "setting",
    }),
];

const cooldown = new Map();

function ratelimit(cmd) {
    if (
        cooldown.has(cmd.user.id) &&
        new Date() - cooldown.get(cmd.user.id) < 3000
    ) {
        return "Please wait a bit before using this command.";
    }
    cooldown.set(cmd.user.id, new Date());
    return false;
}
