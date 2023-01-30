# Fundraising App

It's beautiful Fundraising decentralized app with Solidity smart contract. It's been created to demonstrate and practice my skills.

The smart contract has 100% unit test coverage.

### How to run the project?

```bash
$ npx hardhat compile FundraisingToken # compile smart contract
$ npx hardhat node # start a node
$ npx hardhat run --network localhost scripts/deploy.ts # in the second terminal
$ cd frontend
$ yarn start
```

Copy the contract ID and replace it inside of `./frontend/src/constants/index.ts`

### Dependencies

The project mainly depends on a few OpenZeppelin smart contracts and a Web3Modal library implementing wallet connection.

### Copyrights

All copyrights reserved.
