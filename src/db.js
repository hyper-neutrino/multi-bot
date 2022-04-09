import { MongoClient } from "mongodb";
import config from "./config.js";
import object from "./guild_scope.js";

const db_client = new MongoClient(config.mongo_uri + object.id);
const db = db_client.db();
db.client = db_client;

await db_client.connect();

db.init = async function (name) {
    if (!db.collection(name)) await db.createCollection(name);
    db[name] = db.collection(name);
};

await db.init("counters");

export default db;
