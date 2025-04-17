import { Express } from 'express';
import Config from "../types/config";
import { addTransaction, getCoin } from "../ledger";
import { mergeCoins } from "../merge";
import { splitCoins } from "../split";
import fs from "fs";
import { Coin } from "../types/ledger";
import { sha256 } from "../cryptoUtils";

function register(app: Express, config: Config) {
    const dualRoute = (path: string, handler: any) => {
        app.get(path, handler);
        app.post(path, handler);
    };

    //@ts-ignore
    dualRoute("/transaction", (req, res) => {
        const { cid, sign, newholder } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!cid || !sign || !newholder) return res.status(400).json({ error: "Missing required parameters" });
        try {
            addTransaction(parseInt(cid), newholder, sign);
            res.json({ message: "success" });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/merge", (req, res) => {
        const { origin, target, sign, vol } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!origin || !target || !sign || !vol) return res.status(400).json({ error: "Missing required parameters" });
        try {
            mergeCoins(config, config.ledgerDirectory, parseInt(origin), parseInt(target), sign, parseFloat(vol));
            res.json({ message: "success" });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/split", (req, res) => {
        const { origin, target, sign, vol } = Object.keys(req.body).length !== 0 ? req.body : req.query;
        if (!origin || !target || !sign || !vol) return res.status(400).json({ error: "Missing required parameters" });
        try {
            splitCoins(config, config.ledgerDirectory, parseInt(origin), parseInt(target), sign, parseFloat(vol));
            res.json({ message: "success" });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

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
        const ids = Object.keys(req.body).length !== 0 ? req.body : req.query;
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
        const ids = Object.keys(req.body).length !== 0 ? req.body : req.query;
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
    dualRoute("/ledger-length", (req, res) => {
        try {
            const length = parseInt(fs.readFileSync(config.ledgerDirectory + "/last.id", "utf-8"));
            res.json({ length });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    //@ts-ignore
    dualRoute("/circulation", (req, res) => {
        try {
            const circulation = parseFloat(fs.readFileSync("circulation.save", "utf-8"));
            res.json({ circulation });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });
}

export default register;
