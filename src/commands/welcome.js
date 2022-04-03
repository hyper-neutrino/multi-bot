import { Command } from "paimon.js";
import { set_setting } from "../lib/settings.js";

export default new Command({
    name: "welcome message set",
    description: "Set the welcome message as template JSON.",
    options: ["s:message the message data (as JSON)"],
    async execute(_, data) {
        try {
            await set_setting("welcome-data", JSON.parse(data));
            return [
                "Set the welcome message data.",
                "updated welcome message data",
            ];
        } catch {
            return "Invalid JSON.";
        }
    },
    permission: "setting",
});
