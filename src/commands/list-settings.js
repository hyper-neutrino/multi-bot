import { Command } from "paimon.js";
import db from "../db.js";

export const command = new Command({
    name: "list-settings",
    description: "List all currently defined settings.",
    options: [],
    async execute(_) {
        const rows = [];

        for (const entry of await db.settings.find({}).toArray()) {
            if (entry.value !== undefined) {
                rows.push(`${entry.key} = ${entry.value}`);
            }
        }

        return rows.length > 0
            ? `\`\`\`\n${rows.join("\n")}\n\`\`\``
            : "(none)";
    },
    permission: "setting",
});
