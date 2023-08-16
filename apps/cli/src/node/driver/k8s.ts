import k8s from "@kubernetes/client-node";

import { K8sDriverConfig, NodeDriver } from "./index.js";
import { DApp } from "../database/index.js";

export class K8sDriver implements NodeDriver {
    private config: K8sDriverConfig;
    private api: k8s.CustomObjectsApi;

    constructor(config: K8sDriverConfig) {
        this.config = config;

        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.api = kc.makeApiClient(k8s.CustomObjectsApi);
    }

    private getDAppResourceName(dapp: DApp): string {
        return `dapp-${dapp.address.substring(2, 10).toLocaleLowerCase()}`;
    }

    async start(dapp: DApp, location: string): Promise<void> {
        const { address, blockHash, blockNumber, transactionHash } = dapp;
        const namespace = this.config.namespace;
        const name = this.getDAppResourceName(dapp);

        try {
            await this.api.createNamespacedCustomObject(
                "rollups.cartesi.io",
                "v1alpha1",
                namespace,
                "applications",
                {
                    apiVersion: "rollups.cartesi.io/v1",
                    kind: "Application",
                    metadata: { name },
                    spec: {
                        address,
                        blockHash,
                        blockNumber: blockNumber.toString(),
                        transactionHash,
                        location,
                    },
                },
            );
        } catch (err) {
            // API returns a 409 Conflict if CR already exists.
            if ((err as any).response?.statusCode !== 409) {
                throw err;
            }
        }
    }

    async stop(dapp: DApp): Promise<void> {
        const namespace = this.config.namespace;
        const name = this.getDAppResourceName(dapp);
        await this.api.deleteNamespacedCustomObject(
            "rollups.cartesi.io",
            "v1alpha1",
            namespace,
            "applications",
            name,
        );
    }
}
