# CLC Daemon
CLC (Centralized Ledger Coin) is a revolutionary new type of crypto that utilizes ground-breaking chain-of-ownership technology to create the safest crypto to this day.

## How to Run?
### Requirements
* ```nodejs``` installed
* ```typescript``` installed
### Installation
Clone this repository locally
```bash
git clone https://github.com/clc-crypto/clc-daemon.git
```
Compile into JavaScript
```bash
tsc
```
Run the compiled JavaScript
```bash
node dist/index.js
```
Your CLC daemon should be up and running!

### Next steps
You can fine tune clc's parameters in the config.js file.

## File Documentation
```/src/addMinedCoins.ts```

Contains function to add mined coins to the ledger.

```/src/index.ts```

Program entry point. Configures ledger and API.

```/src/ledger.ts```

Contains basic function to add transactions. Initializes ledger.

```/src/addMinedCoins.ts```

Contains function to add mined coins to the ledger.

```/src/merge.ts```

Contains function to merge coins.

```/src/miner.ts```

Highly deprecated legacy miner. Inefficient and redundant. [For mining check this repository.](https:github.com/clc-crypto/clc-miner)

```/src/miner.ts```

Contains function to split coins.

```/src/types```

Contains all the types used in this project.

```/src/endpoints```

Contains the API endpoints.

## API Endpoints

### /coin/<id>

Gets the coin of a given id from the ledger.
#### Structure
```typescript
{ // Coin
  val: number, // the value of the coin (what amount of 1 coin is it worth)
  genesisTime: number,
  seed?: string,
  diff?: string,
  hash?: string,
  transactions: Transaction[] // the chain-of-ownership list
}

{ // Transaction
    holder: string,
    transactionSignature: string,
    transformationType?: "split" | "merge"
    transformation?: holder: string,
    transactionSignature: string,
    transformation?: MergeTransformationOrigin | MergeTransformationTarget | MergeTransformationTarget
}

{ // Merge Transformation Origin
    target: number, 
    originSignature: string,
    vol: number,
    height: number
}

{ // Merge Transformation Target
    origin: number,
    vol: number,
    height: number
}
```

### /get-challenge

Gets the current mining challenge

#### Structure
```typescript
{
    seed: string,
    diff: string, // hex
    reward: number,
    lastFound: number // unix epoch time
}
```

### /challenge-solved?holder=[holder]&sign=[signature]&hash=[minedHash]

Submits a miners found coin.
* holder: the miners found public key
* signature: the current owners signature on his public key
* minedHash: the miners mined hash ```sha256([holder] + SEED)```

### /transaction?cid=[coinId]&sign=[signature]&newholder=[newholder]

Transacts a coin
* coinId: the id of the coin to transact
* signature: the current owners signature on the newholder
* newholder: the coins new holder (public key)

### /merge?origin=[originId]&target=[targetId]&sign=[signature]&vol=[volume]

Transacts a coin
* originId: the id of the coin to take the funds out of
* targetId: the id of the coin to push the funds into
* signature: the current owners signature on the ```"[targetId] [the length of the targets transactons + 1] [volume]"```
* volume: how much funds to move, must be more than 0 and smaller or equal to the value of the origin coin.

### /split?origin=[originId]&target=[targetId]&sign=[signature]&vol=[volume]

Transacts a coin
* originId: the id of the coin to take the funds out of
* targetId: the length of the ledger
* signature: the current owners signature on the ```"[targetId] 0 [volume]"```
* volume: how much funds to move, must be more than 0 and smaller or equal to the value of the origin coin.

### /ledger-length

Gets the current length of the ledger

#### Structure
```typescript
{
    length: integer
}
```