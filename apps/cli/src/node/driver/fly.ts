import { FlyDriverConfig, NodeDriver } from "./index.js";
import { Application } from "../index.js";

export class FlyDriver implements NodeDriver {
    private config: FlyDriverConfig;

    constructor(config: FlyDriverConfig) {
        this.config = config;
    }

    async start(dapp: Application, location: string): Promise<void> {
        throw new Error(`unsupported driver type: fly`);
    }

    async stop(dapp: Application): Promise<void> {
        throw new Error(`unsupported driver type: fly`);
    }
}
