import k8s from "@kubernetes/client-node";

import { K8sDriverConfig, NodeDriver } from "./index.js";
import { Application } from "../index.js";

export class K8sDriver implements NodeDriver {
    private config: K8sDriverConfig;
    private api: k8s.CustomObjectsApi;

    constructor(config: K8sDriverConfig) {
        this.config = config;

        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.api = kc.makeApiClient(k8s.CustomObjectsApi);
    }

    private getDAppResourceName(dapp: Application): string {
        return `dapp-${dapp.address.substring(2, 10).toLocaleLowerCase()}`;
    }

    async start(application: Application, location: string): Promise<void> {
        const { address, blockHash, blockNumber, transactionHash } =
            application;
        const namespace = this.config.namespace;
        const name = this.getDAppResourceName(application);

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

    async stop(application: Application): Promise<void> {
        const namespace = this.config.namespace;
        const name = this.getDAppResourceName(application);
        await this.api.deleteNamespacedCustomObject(
            "rollups.cartesi.io",
            "v1alpha1",
            namespace,
            "applications",
            name,
        );
    }
}
