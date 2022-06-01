import client from "../client.js";

export default async function (mod, user, reason) {
    await client.home.bans.remove(
        user.id,
        `unbanned by ${mod.user.tag} ${mod.id}`
    );
}
