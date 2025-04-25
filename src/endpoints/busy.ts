const busyNow: Record<string, number> = {}

function take(ip: string) {
    if (!busyNow[ip]) busyNow[ip] = 0;
    busyNow[ip]++;
}

function free(ip: string) {
    if (!busyNow[ip]) return;
    busyNow[ip]--;
    if (busyNow[ip] === 0) delete busyNow[ip];
}

function isFree(ip: string): boolean {
    return busyNow[ip] !== 0;
}

async function waitForFree(ip: string, interval = 50) {
    while (!isFree(ip)) {
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

export { take, free, isFree, waitForFree };