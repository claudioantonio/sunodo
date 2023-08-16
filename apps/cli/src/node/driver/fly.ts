import { FlyDriverConfig, NodeDriver } from "./index.js";
import { DApp } from "../database/index.js";

export class FlyDriver implements NodeDriver {
    private config: FlyDriverConfig;

    constructor(config: FlyDriverConfig) {
        this.config = config;
    }

    async start(dapp: DApp, location: string): Promise<void> {
        throw new Error(`unsupported driver type: fly`);
    }

    async stop(dapp: DApp): Promise<void> {
        throw new Error(`unsupported driver type: fly`);
    }
}
