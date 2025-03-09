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