import { Flags, ux } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";

import { paths } from "../../services/sunodo.js";
import { SunodoCommand } from "../../sunodoCommand.js";

export default class PlatformChains extends SunodoCommand {
    static description = "list chains supported by the platform";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static flags = {
        ...ux.table.flags(),
        live: Flags.string({
            description: "include only live production chains",
        }),
    };

    public async run(): Promise<void> {
        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);
        const getChains = fetcher.path("/chains/").method("get").create();

        const { flags } = await this.parse(PlatformChains);
        const { data } = await getChains({});
        ux.table(
            data,
            {
                id: {},
                name: {},
                label: {},
                testnet: { get: (v) => (v ? "✔" : "") },
                enabled: { get: (v) => (v ? "✔" : "") },
            },
            { ...flags }
        );
    }
}
