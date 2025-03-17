import express from 'express';
import fs from 'fs';
import cors from 'cors';
import { loadLedger } from "./ledger";
import Config from "./types/config";
import register from "./endpoints/mining";
import registerGeneral from "./endpoints/general";
const https = require('https');

const config: Config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
const app = express();

// Enable CORS for all origins
app.use(cors());

const useHttps: boolean = true;

const privateKey = fs.readFileSync('/etc/letsencrypt/live/clc.ix.tc/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/clc.ix.tc/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

loadLedger(config);

register(app, config);
registerGeneral(app, config);

if (useHttps) {
    https.createServer(credentials, app).listen(config.apiPort, () => {
        console.log(`Server running on https://localhost:${config.apiPort}`);
    });
} else {
    app.listen(config.apiPort, () => {
        console.log(`Server running on http://localhost:${config.apiPort}`);
    });
}