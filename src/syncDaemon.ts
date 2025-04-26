import fs from "fs";
import Config from "./types/config";
import {getCoin, incrementLastId} from "./ledger";
import {sha256} from "./cryptoUtils";
import {setJob} from "./endpoints/mining";

type Hashes = {
    [key: number]: string
};

export default async function syncDaemon(daemon: string, config: Config) {
    console.log("Syncing...");
    while (true) {
        const myLength = parseInt(fs.readFileSync(config.ledgerDirectory + "/last.id", "utf-8"));
        const length = (await (await fetch(daemon + "/ledger-length")).json()).length;
        console.log("My length:", length, "Target length:", length);
        if (myLength < length) {
            const ids: number[] = [];
            for (let i = Math.abs(myLength + 1); i < length + 1; i++) ids.push(i);
            console.log("Downloading coins", ids);
            const chunkSize = 10000;
            let dCoins = [];

            for (let i = 0; i < ids.length; i += chunkSize) {
                const chunk = ids.slice(i, i + chunkSize);

                const response = await fetch(daemon + "/coins", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ids: chunk })
                });

                const result = await response.json();
                if (result.error) {
                    console.log("ERR DOWNLOAD:", result.error);
                    return;
                }
                dCoins.push(...result);
            }

            for (const coinId in dCoins) {
                fs.writeFileSync(config.ledgerDirectory + "/" + coinId + ".coin.json", JSON.stringify(dCoins[coinId], null, 2), "utf-8");
                incrementLastId();
            }
        }

        const myHashes: Hashes = {};
        for (let im = 0; im < myLength; im++) {
            myHashes[im] = sha256(JSON.stringify(getCoin(im).transactions));
        }
        const ids: number[] = [];
        for (let i = 0; i < length; i++) ids.push(i);
        const targetHashes = (await (await fetch(daemon + "/coin-hashes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ids
            })
        })).json());
        let correct = true;
        const incorrect = [];
        for (const coinID in myHashes) {
            if (myHashes[coinID] !== targetHashes[coinID]) {
                console.log("Incorrect hash:", coinID);
                correct = false;
                incorrect.push(coinID);
            }
        }
        if (correct) break;
        console.log("Updating coins", incorrect);
        const dCoins = (await (await fetch(daemon + "/coins", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ids: incorrect
            })
        })).json());
        for (const coinId in dCoins) {
            fs.writeFileSync(config.ledgerDirectory + "/" + coinId + ".coin.json", JSON.stringify(dCoins[coinId], null, 2), "utf-8");
        }
    }
}