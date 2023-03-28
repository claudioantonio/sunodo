import { ux } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";
import { SunodoCommand } from "../../sunodoCommand.js";
import { paths } from "../../services/sunodo.js";

export default class ListOrganization extends SunodoCommand {
    static description = "List organizations";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static flags = { ...ux.table.flags() };

    public async run(): Promise<void> {
        const { flags } = await this.parse(ListOrganization);
        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);
        const listOrganizations = fetcher.path("/orgs/").method("get").create();

        try {
            const { data } = await listOrganizations({});
            ux.table(data, { name: {}, slug: {} }, { ...flags });
        } catch (e) {
            if (e instanceof listOrganizations.Error) {
                this.error(e.getActualType().data.message);
            }
        }
    }
}
