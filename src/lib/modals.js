import client from "../client.js";

export const resolvers = new Map();
export const rejecters = new Map();

function random_id() {
    let id = "";
    for (let x = 0; x < 100; ++x) {
        id += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    return id;
}

export function post_modal(interaction, modal) {
    modal.custom_id = random_id();
    client.api.interactions(interaction.id)[interaction.token].callback.post({
        data: {
            type: 9,
            data: modal,
        },
    });
    return new Promise((resolve, reject) => {
        resolvers.set(modal.custom_id, resolve);
        rejecters.set(modal.custom_id, reject);
    });
}
