import { Flags, ux } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";
import { SunodoCommand } from "../../sunodoCommand.js";
import { paths } from "../../services/sunodo.js";

export default class ListApplication extends SunodoCommand {
    static description = "List applications";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static flags = {
        ...ux.table.flags(),
        org: Flags.string({
            description: "organization slug of the applications",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(ListApplication);
        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);
        const listApplications = fetcher.path("/apps/").method("get").create();

        try {
            const { data, status } = await listApplications(flags);
            ux.table(data, { name: {} }, { ...flags });
        } catch (e) {
            if (e instanceof listApplications.Error) {
                this.error(e.getActualType().data.message);
            }
        }
    }
}
