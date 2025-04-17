import express from 'express';
import https from 'https';
import cors from 'cors';
import fs from 'fs';
import { loadLedger } from "./ledger";
import Config from "./types/config";
import { setUp, register as registerMining } from "./endpoints/mining";
import registerGeneral from "./endpoints/general";
import syncDaemon from "./syncDaemon";

// Load config
const config: Config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
loadLedger(config);

// Start Express app
const app = express();
app.use(express.json());
app.use(cors());

(async () => {
    if (process.argv.length == 4 && (process.argv[2] === "--sync" || process.argv[2] === "-s")) {
        await syncDaemon(process.argv[3], config);
        console.log("Synced!");
    }

    setUp(config);
    registerGeneral(app, config);
    registerMining(app, config);

    const privateKey = fs.readFileSync('/etc/letsencrypt/live/clc.ix.tc/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/clc.ix.tc/fullchain.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    https.createServer(credentials, app).listen(443, () => {
        console.log(`HTTPS Server running on https://clc.ix.tc:443`);
    });
})();
