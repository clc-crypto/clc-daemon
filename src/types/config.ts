type Config = {
    apiPort: number,
    ledgerDirectory: string,
    reward: number,
    startingDiff: string,
    target: number,
    targetTimeout: number,
    adjust: number,
    maxSupply: number,
    devFeeAddress: number,
    devFeePercent: number,
    centractFeePercent?: number,
    filterChanges?: string,
    myIp?: string
}

export default Config;