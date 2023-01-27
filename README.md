### How to run the project?

```bash
$ npx hardhat compile FundraisingToken
$ npx hardhat node
$ npx hardhat run --network localhost scripts/deploy.ts # in the second terminal
```

Copy the contract ID and replace it inside of `./frontend/src/constants/index.ts`
