import { Express } from "express";
import Config from "../types/config";
import {addTransaction, getCoin} from "../ledger";
import {mergeCoins} from "../merge";
import {splitCoins} from "../split";
import fs from "fs";

function register(app: Express, config: Config) {
    app.get("/transaction", (req, res) => {
        try {
            if (!req.query.cid) throw new Error("cid parameter required");
            if (!req.query.sign) throw new Error("sign parameter required");
            if (!req.query.newholder) throw new Error("newholder parameter required");

            addTransaction(parseInt(req.query.cid.toString()), req.query.newholder.toString(), req.query.sign.toString());
            res.json({ "message": "success" })
        } catch (e: any) {
            res.status(400).json(e.message);
        }
    });

    app.get("/merge", (req, res) => {
        try {
            if (!req.query.origin) throw new Error("origin parameter required");
            if (!req.query.target) throw new Error("target parameter required");
            if (!req.query.sign) throw new Error("sign parameter required");
            if (!req.query.vol) throw new Error("vol parameter required");

            mergeCoins(config.ledgerDirectory, parseInt(req.query.origin.toString()), parseInt(req.query.target.toString()), req.query.sign.toString(), parseInt(req.query.vol.toString()));
            res.json({ "message": "success" })
        } catch (e: any) {
            res.status(400).json({ "error": e.message });
        }
    });

    app.get("/split", (req, res) => {
        try {
            if (!req.query.origin) throw new Error("origin parameter required");
            if (!req.query.target) throw new Error("target parameter required");
            if (!req.query.sign) throw new Error("sign parameter required");
            if (!req.query.vol) throw new Error("vol parameter required");

            splitCoins(config.ledgerDirectory, parseInt(req.query.origin.toString()), parseInt(req.query.target.toString()), req.query.sign.toString(), parseInt(req.query.vol.toString()));
            res.json({ "message": "success" })
        } catch (e: any) {
            res.status(400).json({ "error": e.message });
        }
    });

    app.get("/coin/:id", async (req, res) => {
        try {
            if (!req.params.id) throw new Error("origin parameter required");

            res.json({ "coin": getCoin(parseInt(req.params.id)) })
        } catch (e: any) {
            res.status(400).json({ "error": e.message });
        }
    });

    app.get("/ledger-length", async (req, res) =>  {
        res.json({ length: parseInt(fs.readFileSync(config.ledgerDirectory + "/last.id", "utf-8")) });
    })
}

export default register;