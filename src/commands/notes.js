import { Command, UserCommand } from "paimon.js";
import { post_modal } from "../lib/modals.js";
import { get_notes, set_notes } from "../lib/notes.js";

export const module = "modnotes";

export const command = [
    new Command({
        name: "notes view",
        description: "View the moderator notes on a user.",
        options: ["u:user the user to check"],
        async execute(cmd, user) {
            const notes = await get_notes(user.id);

            if (notes) {
                return notes;
            } else {
                return await cmd.whisper({
                    embeds: [
                        {
                            title: "No notes.",
                            description: "This user has no moderator notes.",
                            color: "RED",
                        },
                    ],
                });
            }
        },
        permission: "notes",
    }),

    new Command({
        name: "notes edit",
        description: "Edit the moderator notes on a user.",
        options: ["u:user the user to edit"],
        execute,
        permission: "notes",
    }),

    new UserCommand({
        name: "Mod Notes",
        execute,
        permission: "notes",
    }),
];

async function execute(cmd, user) {
    const modal = await post_modal(cmd, {
        title: "Edit Notes",
        components: [
            {
                type: 4,
                style: 2,
                custom_id: "notes.edit",
                label: "Notes",
                value: await get_notes(user.id),
                min_length: 0,
            },
        ],
    });

    await set_notes(user.id, modal.data.components[0].components[0].value);

    await modal.respond({
        content: `Saved ${user}'s notes.`,
        flags: 64,
    });
}
