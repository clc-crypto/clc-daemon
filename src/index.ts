import express from 'express';
import fs from 'fs';
import cors from 'cors';
import { loadLedger } from "./ledger";
import Config from "./types/config";
import register from "./endpoints/mining";
import registerGeneral from "./endpoints/general";

const config: Config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
const app = express();

// Enable CORS for all origins
app.use(cors());

loadLedger(config);

register(app, config);
registerGeneral(app, config);

app.listen(config.apiPort, () => {
    console.log(`Server running on http://localhost:${config.apiPort}`);
});
