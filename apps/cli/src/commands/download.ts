import { Args, Command, Flags } from "@oclif/core";
import path from "path";
import fs from "fs-extra";
import { CID, create } from "kubo-rpc-client";
import { MultiBar, SingleBar } from "cli-progress";
import {
    CarBlockIterator,
    CarBufferReader,
    CarCIDIterator,
    CarIndexedReader,
    CarReader,
} from "@ipld/car";
import progress from "progress-stream";
import {
    recursive as exporter,
    ExporterProgressEvents,
} from "ipfs-unixfs-exporter";
import { ReadableStream } from "stream/web";

export default class Download extends Command {
    static summary = "Download application from IPFS.";

    static description = "Download IPFS .";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static ipfsFlags = {
        "ipfs-url": Flags.url({
            description:
                "address of IPFS node to download the cartesi machine snapshot",
            helpGroup: "IPFS",
        }),
        "ipfs-username": Flags.string({
            description: "username for IPFS node",
            helpGroup: "IPFS",
        }),
        "ipfs-password": Flags.string({
            description: "password for IPFS node",
            helpGroup: "IPFS",
        }),
    };

    static flags = {
        ...this.ipfsFlags,
    };

    static args = {
        cid: Args.string({
            description: "CID of file to download",
            required: true,
        }),
        output: Args.string({
            description: "output directory",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Download);
        const { cid, output } = args;

        // upload tar to IPFS, getting the CID
        // XXX: implement authentication
        const client = create({ url: flags["ipfs-url"] });

        const multibar = new MultiBar({
            clearOnComplete: true,
            autopadding: true,
            format: "{bar} | {filename} | {value}/{total}",
        });

        const bIterator = await CarBlockIterator.fromIterable(
            client.dag.export(CID.parse(cid))
        );
        for await (const block of bIterator) {
            block.cid;
            block.bytes;
        }

        const reader = await CarReader.fromIterable(
            client.dag.export(CID.parse(cid))
        );
        const roots = await reader.getRoots();
        await Promise.all(
            roots.map(async (root) => {
                const entries = exporter(root, {
                    async get(cid) {
                        const block = await reader.get(cid);
                        if (block) {
                            return block.bytes;
                        }
                        return new Uint8Array();
                    },
                });

                const barProgress =
                    (bar: SingleBar) => (evt: ExporterProgressEvents) => {
                        if (
                            evt.type == "unixfs:exporter:progress:unixfs:raw" ||
                            evt.type ==
                                "unixfs:exporter:progress:unixfs:file" ||
                            evt.type == "unixfs:exporter:progress:raw"
                        ) {
                            bar.update(Number(evt.detail.bytesRead));
                        }
                    };
                for await (const entry of entries) {
                    if (entry.type === "file" || entry.type === "raw") {
                        const bar = multibar.create(Number(entry.size), 0, {
                            filename: entry.path,
                        });
                        const filename = path.join(output, entry.path);
                        const file = fs.createWriteStream(filename);
                        for await (const chunk of entry.content({
                            onProgress: barProgress(bar),
                        })) {
                            file.write(chunk);
                        }
                    } else if (entry.type === "directory") {
                        await fs.ensureDir(path.join(output, entry.path));
                    }
                }
            })
        );

        multibar.stop();
        // process.exit(0);
    }
}
