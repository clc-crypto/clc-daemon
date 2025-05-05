type MergeTransformationOrigin = {
    target: number,
    originSignature: string,
    vol: number,
    height: number,
    isSplit?: boolean
}

type MergeTransformationTarget = {
    origin: number,
    vol: number,
    height: number
}

type Centract = {
    centractSignature: string
    transactionSignature: string
    transactionAddress: string
    code: string
}

type Transaction = {
    holder: string,
    transactionSignature: string,
    transformationType?: "merge"
    transformation?: MergeTransformationOrigin | MergeTransformationTarget
    centract?: Centract
}

type Coin = {
    val: number, // the value of the coin (what amount of 1 coin is it worth)
    genesisTime: number,
    paidFee?: boolean,
    locked?: boolean,
    seed?: string,
    diff?: string,
    hash?: string,
    transactions: Transaction[] // the chain-of-ownership list
}

export { Transaction, Coin };