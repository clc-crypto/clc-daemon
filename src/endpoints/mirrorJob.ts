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

let resolving: Array<string> = [];

function resolveJobs() {
    if (config === null) return;
    for (const ip in JSON.parse(fs.readFileSync("mirrors.json", "utf-8"))) {
        if (jobs[ip] && !resolving.includes(ip)) {
            resolving.push(ip);
            const job = jobs[ip].pop();
            if (!job) continue;
            if (jobs[ip].length === 0) delete jobs[ip];

            betterFetch(job.endpoint, config.myIp === undefined ? "0.0.0.0" : config.myIp, job.data).then(res => {
                resolving = resolving.filter(fip => fip !== ip);
                console.log("Mirroring response (" + ip + "): " + res);
            }).catch(e => {
                resolving = resolving.filter(fip => fip !== ip);
                console.log("Error mirroring: " + e.message);
            });
        }
    }
}

setInterval(resolveJobs, 100);

function mirror(endpoint: string, data: any) {
    for (const ip in JSON.parse(fs.readFileSync("mirrors.json", "utf-8"))) {
        jobs[ip].push({
            endpoint,
            data
        });
    }
}

export { setUp, mirror };