type Config = {
    apiPort: number,
    ledgerDirectory: string,
    reward: number,
    startingDiff: string,
    target: number,
    adjust: bigint,
    maxSupply: number,
    devFeeAddress: number,
    devFeePercent: number
}

export default Config;