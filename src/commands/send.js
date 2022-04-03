import { Command } from "paimon.js";
import { post_modal } from "../lib/modals.js";

export default new Command({
    name: "send",
    description: "Send a JSON message.",
    options: [],
    async execute(cmd) {
        const modal = await post_modal(cmd, {
            title: "Message",
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            style: 2,
                            custom_id: "send.data",
                            label: "Message Data (JSON)",
                        },
                    ],
                },
            ],
        });

        await modal.respond({ content: await send(cmd, modal), flags: 64 });
    },
    permission: "send",
});

async function send(cmd, modal) {
    let data;
    try {
        data = JSON.parse(modal.data.components[0].components[0].value);
    } catch {
        return "Invalid JSON.";
    }

    try {
        await cmd.channel.send(data);
    } catch {
        return "Invalid message.";
    }

    return "Sent!";
}
