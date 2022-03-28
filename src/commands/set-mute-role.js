import { Command } from "paimon.js";
import { expand } from "../lib/format.js";
import { set_setting } from "../lib/settings.js";

export default new Command({
    name: "set-mute-role",
    description: "Set the mute role.",
    options: ["r:role the role to set"],
    async execute(_, role) {
        await set_setting("mute", role.id);
        return [`Set mute role to ${role}.`, `= mute role → ${expand(role)}`];
    },
    permission: "setting",
});
