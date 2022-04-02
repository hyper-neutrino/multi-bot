import { res } from "file-ez";
import fs from "fs";

export default {
    ...JSON.parse(fs.readFileSync(res("../config.json")))[process.argv[2]],
    ...JSON.parse(fs.readFileSync(res("../deploy.json"))),
};
