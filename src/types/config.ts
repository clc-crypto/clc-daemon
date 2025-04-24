type Config = {
    apiPort: number,
    ledgerDirectory: string,
    reward: number,
    startingDiff: string,
    target: number,
    targetTimeout: number,
    adjust: bigint,
    maxSupply: number,
    devFeeAddress: number,
    devFeePercent: number,
    filterChanges?: string,
}

export default Config;