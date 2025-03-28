import net from 'net';
import fs from 'fs';
import { loadLedger } from "./ledger";
import Config from "./types/config";
import {setUp, register} from "./endpoints/mining";
import registerGeneral from "./endpoints/general";
import syncDaemon from "./syncDaemon";

// Load config
const config: Config = JSON.parse(fs.readFileSync("config.json", 'utf8'));

loadLedger(config);
(async () => {
    if (process.argv.length == 4 && (process.argv[2] === "--sync" || process.argv[2] === "-s")) {
        await syncDaemon(process.argv[3], config);
        console.log("Synced!");
    }
    setUp(config);
    // Create a TCP server
    const server = net.createServer((socket) => {
        registerGeneral(socket, config);
        register(socket, config);

        socket.on('data', data => {
            try {
                const request = JSON.parse(data.toString());
                switch (request.endpoint) {
                    case "transaction":
                        break;
                    case "merge":
                        break;
                    case "split":
                        break;
                    case "coin":
                        break;
                    case "coins":
                        break;
                    case "coin-hashes":
                        break;
                    case "ledger-length":
                        break;
                    case "circulation":
                        break;
                    case "get-challenge":
                        break;
                    case "challenge-solved":
                        break;
                    default:
                        socket.write(JSON.stringify({ error: "No such endpoint: " + request.endpoint }));
                }
            } catch (e: any) {
                socket.write(e.message);
            }
        });

        socket.on('error', (err) => {
            console.error(`Socket error: ${err.message}`);
        });
    });

    // Start the server on the specified port
    server.listen(config.apiPort, () => {
        console.log(`TCP server running on tcp://localhost:${config.apiPort}`);
    });
})();