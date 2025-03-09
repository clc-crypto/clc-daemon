type Config = {
    apiPort: number,
    ledgerDirectory: string,
    reward: number,
    startingDiff: string,
    target: number,
    adjust: bigint,
}

export default Config;