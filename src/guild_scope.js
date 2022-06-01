import config from "./config.js";

if (process.argv.length < 3) {
    throw new Error("Missing guild scope.");
}

const object = config.guilds[process.argv[2]];

if (!object) {
    throw new Error(`Guild not recognized: ${process.argv[2]}`);
}

export default object;
