import { Command } from "paimon.js";
import { do_warn } from "../moderation/warn.js";

export const module = "moderation";

export const command = new Command({
    name: "warn",
    description: "Warn a user (is logged).",
    options: [
        "u:user the user to warn",
        "s:reason the reason to include",
        "b:dm* whether or not to DM the user (default true)",
    ],
    execute: do_warn(true),
    permission: "warn",
});
