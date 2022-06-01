import client from "../client.js";

export function expand(item) {
    if (!item) return `${item}`;

    if (item.tag) {
        return `${item} (${item.tag} \`${item.id}\`)`;
    } else if (item.user) {
        return `${item} (${item.user.tag} \`${item.id}\`)`;
    } else if (item.permissionOverwrites || item.send) {
        return `${item} (#${item.name} \`${item.id}\`)`;
    } else if (item.members) {
        return `${item} (@${item.name} \`${item.id}\`)`;
    } else {
        return item.toString();
    }
}

export function timestamp(time, flag) {
    return `<t:${Math.floor(time.getTime() / 1000)}${flag ? `:${flag}` : ""}>`;
}

export async function tag_user(id) {
    try {
        return (await client.users.fetch(id)).tag;
    } catch {
        return "Unknown User";
    }
}

export function b2e(bool) {
    return bool ? "yes" : "no";
}

export function parse_duration(str) {
    str ||= "";
    str = str.trim();
    if (str.match(/^\d+$/)) return parseInt(str) * 1000;
    if (!str || str == "forever" || str == "0") return 0;
    var years = str.match(/(\d+)\s*(y|yr|year|yrs|years)\b/);
    var months = str.match(/(\d+)\s*(mo|mos|month|months)\b/);
    var weeks = str.match(/(\d+)\s*(w|wk|wks|week|weeks)\b/);
    var days = str.match(/(\d+)\s*(d|day|days)\b/);
    var hours = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
    var minutes = str.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
    var seconds = str.match(/(\d+)\s*(s|sec|secs|second|seconds)\b/);
    const now = new Date();
    const time = new Date();
    if (years) time.setFullYear(time.getFullYear() + parseInt(years[1]));
    if (months) time.setMonth(time.getMonth() + parseInt(months[1]));
    var second_shift = 0;
    if (weeks) second_shift += parseInt(weeks[1]) * 604800;
    if (days) second_shift += parseInt(days[1]) * 86400;
    if (hours) second_shift += parseInt(hours[1]) * 3600;
    if (minutes) second_shift += parseInt(minutes[1]) * 60;
    if (seconds) second_shift += parseInt(seconds[1]);
    time.setSeconds(time.getSeconds() + second_shift);
    return time - now;
}

export function unparse_duration(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    const components = [];
    for (const [name, value] of [
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
        ["second", 1],
    ]) {
        const count = Math.floor(seconds / value);
        seconds %= value;
        if (count) components.push(`${count} ${name}${pluralize(count)}`);
    }
    const output = components.join(" ");
    return output ? "for " + output : "indefinitely";
}

export function pluralize(item, single, plural) {
    single ||= "";
    plural ||= "s";
    return item == 1 ? single : plural;
}

export const DM_STATUSES = [
    "but no DM was sent",
    "and a DM was sent",
    "but DMing them failed (possible reasons: user has DMs closed, user blocked me)",
];
