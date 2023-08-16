import fs from "fs";
import path from "path";
import k8s, {
    V1CustomResourceDefinition,
    loadYaml,
} from "@kubernetes/client-node";

import { K8sDriverConfig, NodeDriver } from "./index.js";
import { DApp } from "../database/index.js";

export class K8sDriver implements NodeDriver {
    private config: K8sDriverConfig;
    private k8sApi: k8s.CustomObjectsApi;
    private crd: V1CustomResourceDefinition;

    constructor(config: K8sDriverConfig) {
        this.config = config;

        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

        // parse CRD
        const crdFile = path.join(
            path.dirname(new URL(import.meta.url).pathname),
            "dapp.yaml",
        );
        this.crd = loadYaml(
            fs.readFileSync(crdFile, "utf8"),
        ) as V1CustomResourceDefinition;
    }

    private getDAppResourceName(dapp: DApp): string {
        return `dapp-${dapp.address.substring(2, 10).toLocaleLowerCase()}`;
    }

    async start(dapp: DApp, location: string): Promise<void> {
        const { address, blockHash, blockNumber, transactionHash } = dapp;
        const kind = this.crd.spec.names.kind;
        const group = this.crd.spec.group;
        const version = this.crd.spec.versions[0].name;
        const plural = this.crd.spec.names.plural;
        const namespace = this.config.namespace;

        const name = this.getDAppResourceName(dapp);
        const document = {
            apiVersion: `${group}/${version}`,
            kind,
            metadata: { name },
            spec: {
                address,
                blockHash,
                blockNumber: blockNumber.toString(),
                transactionHash,
                location,
            },
        };

        try {
            await this.k8sApi.createNamespacedCustomObject(
                group,
                version,
                namespace,
                plural,
                document,
            );
        } catch (err) {
            // API returns a 409 Conflict if CR already exists.
            if ((err as any).response?.statusCode !== 409) {
                throw err;
            }
        }
    }

    async stop(dapp: DApp): Promise<void> {
        const kind = this.crd.spec.names.kind;
        const group = this.crd.spec.group;
        const version = this.crd.spec.versions[0].name;
        const plural = this.crd.spec.names.plural;
        const namespace = this.config.namespace;

        const name = this.getDAppResourceName(dapp);
        await this.k8sApi.deleteNamespacedCustomObject(
            group,
            version,
            namespace,
            plural,
            name,
        );
    }
}
