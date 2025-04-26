import betterFetch from "../betterFetch";
import Config from "../types/config";
import fs from "fs";

type Job = {
    endpoint: string;
    data: any;
}

const jobs: Record<string, Array<Job>> = {}
let config: Config | null = null;
function setUp(cfg: Config) {
    config = cfg;
}

let resolving = false;

async function resolveJobs() {
    if (resolving) return; // prevent overlapping
    resolving = true;
    try {
        if (config === null) return;
        for (const ip of JSON.parse(fs.readFileSync("mirrors.json", "utf-8"))) {
            if (jobs[ip] && jobs[ip].length !== 0) {
                const job = jobs[ip].shift();
                if (!job) continue;
                try {
                    const res = await betterFetch(ip + "/" + job.endpoint, config.myIp === undefined ? "0.0.0.0" : config.myIp, job.data);
                    console.log("Mirroring response (" + ip + "): " + res);
                } catch (e: any) {
                    console.log(e.message);
                }
            }
        }
    } catch (e: any) {
        console.log(e.message);
    } finally {
        resolving = false;
    }
}

setInterval(resolveJobs, 100);

function mirror(endpoint: string, data: any) {
    try {
        for (const ip of JSON.parse(fs.readFileSync("mirrors.json", "utf-8"))) {
            if (jobs[ip] === undefined) jobs[ip] = [];
            jobs[ip].push({
                endpoint,
                data
            });
        }
    } catch (e: any) {
        console.log(e.message);
    }
}

export { setUp, mirror };