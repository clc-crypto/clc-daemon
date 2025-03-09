import express from 'express';
import fs from 'fs';
import { loadLedger } from "./ledger";
import Config from "./types/config";
import register from "./endpoints/mining";
import registerGeneral from "./endpoints/general";
import {ec} from "elliptic";
import {hash} from "crypto";

const config: Config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
const app = express();

loadLedger(config);

register(app, config);
registerGeneral(app, config);

app.listen(config.apiPort, () => {
    console.log(`Server running on http://localhost:${config.apiPort}`);
});