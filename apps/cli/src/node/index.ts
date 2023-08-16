import { Address, Hash } from "viem";

export { Database } from "./database.js";

export type Application = {
    address: Address;
    blockHash: Hash;
    blockNumber: bigint;
    transactionHash: Hash;
    shutdownAt: bigint;
};
