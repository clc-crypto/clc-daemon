import fs from "fs";
import Config from "./types/config";
import { getCoin, incrementLastId } from "./ledger";
import { sha256 } from "./cryptoUtils";
import { setJob } from "./endpoints/mining";

type Hashes = {
    [key: number]: string;
};

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

export default async function syncDaemon(daemon: string, config: Config) {
    console.log("Syncing...");
    const chunkSize = 10000;

    while (true) {
        const myLength = parseInt(fs.readFileSync(config.ledgerDirectory + "/last.id", "utf-8"));
        const length = (await (await fetch(daemon + "/ledger-length")).json()).length;
        console.log("My length:", myLength, "Target length:", length);

        if (myLength < length) {
            const ids = [];
            for (let i = myLength + 1; i <= length; i++) ids.push(i);

            console.log("Downloading missing coins", ids);
            const dCoins: Record<string, any> = {};

            for (const chunk of chunkArray(ids, chunkSize)) {
                const response = await fetch(daemon + "/coins", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: chunk })
                });
                const result = await response.json();
                if (result.error) {
                    console.log("ERR DOWNLOAD:", result.error);
                    return;
                }

                Object.assign(dCoins, result);
                console.log("Next chunk...")
            }

            for (const coinId in dCoins) {
                fs.writeFileSync(
                    `${config.ledgerDirectory}/${coinId}.coin.json`,
                    JSON.stringify(dCoins[coinId], null, 2),
                    "utf-8"
                );
                incrementLastId();
            }
        }

        // Now validate hashes
        const myHashes: Hashes = {};
        for (let i = 0; i < myLength; i++) {
            myHashes[i] = sha256(JSON.stringify(getCoin(i).transactions));
        }

        const ids = [];
        for (let i = 0; i < length; i++) ids.push(i);

        const targetHashes: Hashes = {};

        console.log("Downloading coin hashes...");
        for (const chunk of chunkArray(ids, chunkSize)) {
            const response = await fetch(daemon + "/coin-hashes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: chunk })
            });
            const chunkHashes = await response.json();
            Object.assign(targetHashes, chunkHashes);
        }

        let correct = true;
        const incorrect: number[] = [];
        for (const coinID in myHashes) {
            if (myHashes[coinID] !== targetHashes[coinID]) {
                console.log("Incorrect hash:", coinID);
                correct = false;
                incorrect.push(Number(coinID));
            }
        }
        if (correct) break;

        console.log("Redownloading incorrect coins:", incorrect);
        const fixedCoins: Record<string, any> = {};

        for (const chunk of chunkArray(incorrect, chunkSize)) {
            const response = await fetch(daemon + "/coins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: chunk })
            });
            const chunkCoins = await response.json();
            Object.assign(fixedCoins, chunkCoins);
        }

        for (const coinId in fixedCoins) {
            fs.writeFileSync(
                `${config.ledgerDirectory}/${coinId}.coin.json`,
                JSON.stringify(fixedCoins[coinId], null, 2),
                "utf-8"
            );
        }
    }
}
