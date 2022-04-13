import { Command } from "paimon.js";
import { set_setting } from "../lib/settings.js";

export const module = "moderation";

export const command = new Command({
    name: "set-appeal-form",
    description: "Set the appeal form URL (or leave blank to unset).",
    options: ["s:link* the appeal form URL"],
    async execute(_, link) {
        await set_setting("appeal-form", link);
        return link
            ? [`Set the appeal form to ${link}`, `= appeal-form ${link}`]
            : [`Removed the appeal form link`, `× appeal-form`];
    },
});
