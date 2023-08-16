import { Command, Flags } from "@oclif/core";

import DAppOperator from "../node/operator/index.js";
import { KubeConfig } from "@kubernetes/client-node";

export default class Operator extends Command {
    static summary = "Run a kubernetes cartesi operator.";

    static description =
        "A kubernetes cartesi operator watches DApp custom resources and launches nodes for those DApps.";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static flags = {
        "rpc-url": Flags.string({
            description: "JSON-RPC url of ethereum node",
            char: "r",
        }),
        "epoch-duration": Flags.integer({
            description: "duration of an epoch (in seconds)",
            default: 86400,
        }),
        ipfs: Flags.url({
            description:
                "address of IPFS node to download cartesi machine snapshots",
            default: new URL("http://127.0.0.1:5001"),
        }),
        "mnemonic-passphrase": Flags.string({
            description: "Use a BIP39 passphrase for the mnemonic.",
            helpGroup: "Wallet",
        }),
        "mnemonic-index": Flags.integer({
            description: "Use the private key from the given mnemonic index.",
            helpGroup: "Wallet",
            default: 0,
        }),
        namespace: Flags.string({
            summary: "kubernetes namespace to watch for DApps",
            default: "default",
        }),
        "kms-key-id": Flags.string({
            summary: "Use a private key stored in an AWS KMS key.",
            description:
                "Need access to use the key through standard AWS client authentication mechanisms.",
            helpGroup: "Wallet",
        }),
        verbose: Flags.boolean({
            description: "verbose output",
            default: false,
            char: "v",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(Operator);

        const kubeConfig = new KubeConfig();
        kubeConfig.loadFromDefault();

        // start operator
        const operator = new DAppOperator(kubeConfig, flags.namespace);
        await operator.start();
        const exit = (_reason: string) => {
            operator.stop();
            process.exit(0);
        };
        process
            .on("SIGTERM", () => exit("SIGTERM"))
            .on("SIGINT", () => exit("SIGINT"));
    }
}
