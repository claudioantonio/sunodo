import { Address, Hash } from "viem";

export { Database } from "./database.js";

/**
 * Logger interface.
 */
export interface Logger {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export class NullLogger implements Logger {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public debug(message: string): void {
        // no-op
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public info(message: string): void {
        // no-op
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public warn(message: string): void {
        // no-op
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public error(message: string): void {
        // no-op
    }
}

export type Application = {
    address: Address;
    blockHash: Hash;
    blockNumber: bigint;
    transactionHash: Hash;
    shutdownAt: bigint;
};
