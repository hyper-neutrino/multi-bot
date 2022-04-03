import { Command } from "paimon.js";
import { post_modal } from "../lib/modals.js";

export default new Command({
    name: "reaction-role create",
    description: "Create a reaction role prompt.",
    options: [
        "b:customize true to include a custom message; false to leave it blank",
        "i:max:0- maximum concurrent roles (0 for unlimited)",
        "r:role-1 role #1",
    ].concat(
        [2, 3, 4, 5, 6, 7, 8, 9, 10].map(
            (index) => `r:role-${index}* role #${index}`
        )
    ),
    async execute(cmd, customize, max, ...roles) {
        let message = {};
        let modal;

        if (customize) {
            modal = await post_modal(cmd, {
                title: "Message",
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                style: 2,
                                custom_id: "reaction-role.data",
                                label: "Message Data (JSON)",
                            },
                        ],
                    },
                ],
            });

            try {
                message = JSON.parse(
                    modal.data.components[0].components[0].value
                );
            } catch {
                await modal.respond({ content: "Invalid JSON.", flags: 64 });
                return;
            }
        }

        roles = roles.filter((role) => role);
        if (roles.length == 1) {
            await cmd.channel.send({
                ...message,
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "PRIMARY",
                                customId: `role.${roles[0].id}`,
                                label: roles[0].name,
                            },
                        ],
                    },
                ],
            });
        } else {
            const options = roles.map((role) => ({
                label: role.name,
                value: role.id,
            }));

            await cmd.channel.send({
                ...message,
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "SELECT_MENU",
                                customId: "multi-role",
                                options,
                                maxValues: max || options.length,
                            },
                        ],
                    },
                ],
            });
        }

        if (!modal) return "Posted.";
        await modal.respond({ content: "Posted.", flags: 64 });
    },
    permission: "reaction-role",
});
