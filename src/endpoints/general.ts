import { Express } from 'express';
import Config from "../types/config";
import { addTransaction, getCoin } from "../ledger";
import { mergeCoins } from "../merge";
import { splitCoins } from "../split";
import fs from "fs";
import { Coin } from "../types/ledger";
import { sha256 } from "../cryptoUtils";
import { mirror } from "./mirrorJob";
import addCentract, {clcTxDaemon} from "../centractDaemon";

function register(app: Express, config: Config) {
    function restrict(req: any, res: any, next: any) {
        if (!config.filterChanges) return next();
        const clientIP = req.ip || req.connection.remoteAddress;

        // IPv6-mapped IPv4 address handling
        const normalizedIP = clientIP.replace('::ffff:', '');

        if (normalizedIP === config.filterChanges) {
            next();
        } else {
            res.status(403).send('IP not allowed: ' + normalizedIP);
        }
    }

    const dualRoute = (path: string, handler: any, restrictor?: any) => {
        if (restrictor) {
            app.get(path, restrictor, handler);
            app.post(path, restrictor, handler);
        } else {
            app.get(path, handler);
            app.post(path, handler);
        }
    };

    //@ts-ignore
    dualRoute("/transaction", (req, res) => {
        const { cid, sign, newholder } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!cid || !sign || !newholder) return res.status(400).json({ error: "Missing required parameters" });
        try {
            mirror("transaction", { cid, sign, newholder });
            const holder = getCoin(cid).transactions[getCoin(cid).transactions.length - 1].holder;
            addTransaction(parseInt(cid), newholder, sign);
            clcTxDaemon(parseInt(cid), holder, newholder, sign);
            res.json({ message: "success" });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
            console.log("error: transaction " + e.message);
        }
    }, restrict);

    //@ts-ignore
    dualRoute("/centract", (req, res) => {
        const { cid, sign, newholder, centract, centractsign, feesign } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!cid || !sign || !newholder || !centract || !centractsign) return res.status(400).json({ error: "Missing required parameters" });
        try {
            const feeVol = Math.sqrt(config.centractFeePercent === undefined ? 1.2 : config.centractFeePercent * centract.trim().split("\n").length) / 100 * getCoin(cid).val;
            fetch(`http://localhost:7070/merge?origin=${cid}&target=${config.devFeeAddress}&vol=${feeVol}&sign=${feesign}`).then(res => res.json()).then(r => {
                if (r.error) {
                    res.status(500).json({ error: "Error paying fee: " + r.error });
                    return;
                }
                try {
                    addCentract(cid, sign, newholder, centract, centractsign);
                    res.json({ message: "success" });
                } catch (e: any) {
                    res.status(500).json({ error: e.message });
                }
            }).catch((e: any) => res.json({ error: "Error fetching to pay fees: " + e.message }));
        } catch (e: any) {
            res.status(500).json({ error: e.message });
            console.log("error: centract " + e.message);
        }
    }, restrict);

    app.get("/centract-fee/:id", (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const lines = parseInt(req.query.lines as string);
            const val = getCoin(id).val;
            res.json({ fee: Math.sqrt(config.centractFeePercent === undefined ? 1.2 : config.centractFeePercent * lines) / 100 * val });
        } catch (e: any) {
            res.json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/merge", (req, res) => {
        const { origin, target, sign, vol } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!origin || !target || !sign || !vol) return res.status(400).json({ error: "Missing required parameters" });
        try {
            mirror("merge", { origin, target, sign, vol });
            mergeCoins(config, config.ledgerDirectory, parseInt(origin), parseInt(target), sign, parseFloat(vol));
            res.json({ message: "success" });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
            console.log("error: merge " + e.message);
        }
    }, restrict);

    //@ts-ignore
    dualRoute("/split", (req, res) => {
        const { origin, target, sign, vol } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!origin || !target || !sign || !vol) return res.status(400).json({ error: "Missing required parameters" });
        try {
            mirror("split", { origin, target, sign, vol });
            splitCoins(config, config.ledgerDirectory, parseInt(origin), parseInt(target), sign, parseFloat(vol));
            res.json({ message: "success" });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
            console.log("error: split " + e.message);
        }
    }, restrict);

    //@ts-ignore
    dualRoute("/coin", (req, res) => {
        const id = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!id) return res.status(400).json({ error: "Missing coin ID" });
        try {
            const coin = getCoin(parseInt(id));
            res.json({ coin });
        } catch (e: any) {
            res.status(404).json({ error: e.message });
        }
    });

    // @ts-ignore
    app.get("/coin/:id", (req, res) => {
        const id = req.params.id;
        if (!id) return res.status(400).json({ error: "Missing coin ID" });
        try {
            const coin = getCoin(parseInt(id));
            res.json({ coin });
        } catch (e: any) {
            res.status(404).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/coins", (req, res) => {
        const { ids } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!ids) return res.status(400).json({ error: "Missing coin IDs" });
        try {
            const result: { [key: number]: Coin } = {};
            for (const id of ids) {
                result[parseInt(id)] = getCoin(parseInt(id));
            }
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/coin-hashes", (req, res) => {
        const { ids } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!ids) return res.status(400).json({ error: "Missing coin IDs" });
        try {
            const result: { [key: number]: string } = {};
            for (const id of ids) {
                result[id] = sha256(JSON.stringify(getCoin(id).transactions));
            }
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/ledger-length", (_, res) => {
        try {
            const length = parseInt(fs.readFileSync(config.ledgerDirectory + "/last.id", "utf-8"));
            res.json({ length });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/circulation", (_, res) => {
        try {
            const circulation = parseFloat(fs.readFileSync("circulation.save", "utf-8"));
            res.json({ circulation });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/config", (_, res) => {
        try {
            const cfg = JSON.parse(fs.readFileSync("config.json", "utf-8"));
            res.json(cfg);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/mirrors", (_, res) => {
        try {
            const mirrors = JSON.parse(fs.readFileSync("mirrors.json", "utf-8"));
            res.json(mirrors);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/centract-events", (_, res) => {
        try {
            const mirrors = JSON.parse(fs.readFileSync("centract-events.json", "utf-8"));
            res.json(mirrors);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });
}

export default register;