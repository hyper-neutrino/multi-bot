import { Event } from "paimon.js";
import { destroy_custom_role } from "../lib/custom-roles.js";
import { has_permission } from "../lib/permissions.js";

export default [
    new Event({
        event: "guildMemberUpdate",

        async run(_, member) {
            if (!(await has_permission("custom-role", member))) {
                await destroy_custom_role(member);
            }
        },
    }),

    new Event({
        event: "guildMemberRemove",

        run: destroy_custom_role,
    }),
];
