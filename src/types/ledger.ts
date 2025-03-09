type MergeTransformationOrigin = {
    target: number,
    originSignature: string,
    vol: number,
    height: number
}

type MergeTransformationTarget = {
    origin: number,
    vol: number,
    height: number
}

type Transaction = {
    holder: string,
    transactionSignature: string,
    transformationType?: "split" | "merge"
    transformation?: MergeTransformationOrigin | MergeTransformationTarget
}

type Coin = {
    val: number, // the value of the coin (what amount of 1 coin is it worth)
    genesisTime: number,
    seed?: string,
    diff?: string,
    hash?: string,
    transactions: Transaction[] // the chain-of-ownership list
}

export { Transaction, Coin };