"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ledger_1 = require("../ledger");
const merge_1 = require("../merge");
const split_1 = require("../split");
const fs_1 = __importDefault(require("fs"));
function register(app, config) {
    app.get("/transaction", (req, res) => {
        try {
            if (!req.query.cid)
                throw new Error("cid parameter required");
            if (!req.query.sign)
                throw new Error("sign parameter required");
            if (!req.query.newholder)
                throw new Error("newholder parameter required");
            (0, ledger_1.addTransaction)(parseInt(req.query.cid.toString()), req.query.newholder.toString(), req.query.sign.toString());
            res.json({ "message": "success" });
        }
        catch (e) {
            res.status(400).json(e.message);
        }
    });
    app.get("/merge", (req, res) => {
        try {
            if (!req.query.origin)
                throw new Error("origin parameter required");
            if (!req.query.target)
                throw new Error("target parameter required");
            if (!req.query.sign)
                throw new Error("sign parameter required");
            if (!req.query.vol)
                throw new Error("vol parameter required");
            (0, merge_1.mergeCoins)(config.ledgerDirectory, parseInt(req.query.origin.toString()), parseInt(req.query.target.toString()), req.query.sign.toString(), parseFloat(req.query.vol.toString()));
            res.json({ "message": "success" });
        }
        catch (e) {
            res.status(400).json({ "error": e.message });
        }
    });
    app.get("/split", (req, res) => {
        try {
            if (!req.query.origin)
                throw new Error("origin parameter required");
            if (!req.query.target)
                throw new Error("target parameter required");
            if (!req.query.sign)
                throw new Error("sign parameter required");
            if (!req.query.vol)
                throw new Error("vol parameter required");
            (0, split_1.splitCoins)(config.ledgerDirectory, parseInt(req.query.origin.toString()), parseInt(req.query.target.toString()), req.query.sign.toString(), parseFloat(req.query.vol.toString()));
            res.json({ "message": "success" });
        }
        catch (e) {
            res.status(400).json({ "error": e.message });
        }
    });
    app.get("/coin/:id", async (req, res) => {
        try {
            if (!req.params.id)
                throw new Error("origin parameter required");
            res.json({ "coin": (0, ledger_1.getCoin)(parseInt(req.params.id)) });
        }
        catch (e) {
            res.status(400).json({ "error": e.message });
        }
    });
    app.get("/ledger-length", async (req, res) => {
        res.json({ length: parseInt(fs_1.default.readFileSync(config.ledgerDirectory + "/last.id", "utf-8")) });
    });
}
exports.default = register;
