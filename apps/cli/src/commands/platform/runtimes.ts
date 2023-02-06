import { Flags, ux } from "@oclif/core";
import { Fetcher } from "openapi-typescript-fetch";
import { paths } from "../../services/sunodo";
import { SunodoCommand } from "../../sunodoCommand";

export default class PlatformRuntimes extends SunodoCommand {
    static description = "list runtimes supported by the platform";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static flags = {
        ...ux.table.flags(),
        live: Flags.string({
            description: "include only live production chains",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(PlatformRuntimes);

        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);
        const getChains = fetcher.path("/runtimes/").method("get").create();
        const { data } = await getChains({});
        ux.table(
            data,
            {
                name: {},
            },
            { ...flags }
        );
    }
}
