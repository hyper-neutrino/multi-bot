import { get_setting_channel } from "./lib/settings.js";

export async function log(message) {
    const logs = await get_setting_channel("logs.command");
    if (!logs) return;
    return await logs.send(message);
}
