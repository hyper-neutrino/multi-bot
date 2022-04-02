import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { post_modal } from "../lib/modals.js";
import {
    link_supporter_role,
    unlink_supporter_role,
} from "../lib/supporter-announcements.js";

export default [
    new Command({
        name: "supporter-announcement set",
        description:
            "Link a role as a supporter role and set its announcement.",
        options: ["r:role the role to link"],
        async execute(cmd, role) {
            const modal = await post_modal(cmd, {
                title: "Set Supporter Announcement",
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                style: 1,
                                custom_id: "supporter-announcement.title",
                                label: "Title",
                                max_length: 256,
                            },
                        ],
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                style: 2,
                                custom_id: "supporter-announcement.body",
                                label: "Body",
                                max_length: 1000,
                                placeholder:
                                    "{name}, {nick}, {mention}, {tag} = Example#0000, {discriminator} = 0000, {count} = # role members",
                            },
                        ],
                    },
                ],
            });

            const title = modal.data.components[0].components[0].value;
            const body = modal.data.components[1].components[0].value;

            await link_supporter_role(role.id, title, body);

            await modal.respond({
                content: `Set supporter announcement for ${role}.`,
                flags: 64,
            });

            await cmd.log(`* link supporter: ${expand(role)}`);
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
