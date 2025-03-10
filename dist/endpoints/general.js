"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ledger_1 = require("../ledger");
const merge_1 = require("../merge");
const split_1 = require("../split");
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
            (0, merge_1.mergeCoins)(config.ledgerDirectory, parseInt(req.query.origin.toString()), parseInt(req.query.target.toString()), req.query.sign.toString(), parseInt(req.query.target.toString()));
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
            (0, split_1.splitCoins)(config.ledgerDirectory, parseInt(req.query.origin.toString()), parseInt(req.query.target.toString()), req.query.sign.toString(), parseInt(req.query.target.toString()));
            res.json({ "message": "success" });
        }
        catch (e) {
            res.status(400).json({ "error": e.message });
        }
    });
    app.get("/coin/:id", (req, res) => {
        try {
            if (!req.params.id)
                throw new Error("origin parameter required");
            res.json({ "coin": (0, ledger_1.getCoin)(parseInt(req.params.id)) });
        }
        catch (e) {
            res.status(400).json({ "error": e.message });
        }
    });
}
exports.default = register;
