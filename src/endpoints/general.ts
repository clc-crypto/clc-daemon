import { Socket } from 'net';
import Config from "../types/config";
import { addTransaction, getCoin } from "../ledger";
import { mergeCoins } from "../merge";
import { splitCoins } from "../split";
import fs from "fs";
import {Coin} from "../types/ledger";
import {sha256} from "../cryptoUtils";

function register(socket: Socket, config: Config) {
    socket.on('data', (data) => {
        try {
            function handleTransaction(request: any, socket: Socket) {
                try {
                    if (!request.cid || !request.sign || !request.newholder) {
                        throw new Error("Missing required parameters");
                    }
                    addTransaction(parseInt(request.cid), request.newholder, request.sign);
                    socket.write(JSON.stringify({ message: "success" }));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleMerge(request: any, socket: Socket) {
                try {
                    if (!request.origin || !request.target || !request.sign || !request.vol) {
                        throw new Error("Missing required parameters");
                    }
                    mergeCoins(config.ledgerDirectory, parseInt(request.origin), parseInt(request.target), request.sign, parseFloat(request.vol));
                    socket.write(JSON.stringify({ message: "success" }));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleSplit(request: any, socket: Socket) {
                try {
                    if (!request.origin || !request.target || !request.sign || !request.vol) {
                        throw new Error("Missing required parameters");
                    }
                    splitCoins(config.ledgerDirectory, parseInt(request.origin), parseInt(request.target), request.sign, parseFloat(request.vol));
                    socket.write(JSON.stringify({ message: "success" }));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleCoin(request: any, socket: Socket) {
                try {
                    if (request.id === undefined) throw new Error("Missing coin ID");
                    const coin = getCoin(request.id);
                    socket.write(JSON.stringify({coin}));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleCoins(request: any, socket: Socket) {
                try {
                    if (request.ids === undefined) throw new Error("Missing coin IDs");
                    type Res = {
                        [key: number]: Coin
                    }
                    const res: Res = {};
                    for (const id of request.ids) {
                        res[parseInt(id)] = getCoin(parseInt(id));
                    }
                    socket.write(JSON.stringify(res));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleCoinHashes(request: any, socket: Socket) {
                try {
                    if (request.ids === undefined) throw new Error("Missing coin IDs");
                    type Res = {
                        [key: number]: string
                    }
                    const res: Res = {};
                    for (const id of request.ids) {
                        res[id] = sha256(JSON.stringify(getCoin(id).transactions));
                    }
                    socket.write(JSON.stringify(res));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleLedgerLength(socket: Socket) {
                try {
                    const length = parseInt(fs.readFileSync(config.ledgerDirectory + "/last.id", "utf-8"));
                    socket.write(JSON.stringify({length}));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }

            function handleCirculation(socket: Socket) {
                try {
                    const circulation = parseFloat(fs.readFileSync("circulation.save", "utf-8"));
                    socket.write(JSON.stringify({circulation}));
                } catch (e: any) {
                    socket.write(JSON.stringify({ error: e.message }));
                }
            }
            const request = JSON.parse(data.toString());
            switch (request.endpoint) {
                case "transaction":
                    handleTransaction(request.data, socket);
                    break;
                case "merge":
                    handleMerge(request.data, socket);
                    break;
                case "split":
                    handleSplit(request.data, socket);
                    break;
                case "coin":
                    handleCoin(request.data, socket);
                    break;
                case "coins":
                    handleCoins(request.data, socket);
                    break;
                case "coin-hashes":
                    handleCoinHashes(request.data, socket);
                    break;
                case "ledger-length":
                    handleLedgerLength(socket);
                    break;
                case "circulation":
                    handleCirculation(socket);
                    break;
            }
        } catch (e: any) {
            console.log(e.message);
        }
    });
}

export default register;
