import ora from "ora";
import c from "ansi-colors";
import { Args } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";

import { SunodoCommand } from "../../sunodoCommand.js";
import { paths } from "../../services/sunodo.js";

export default class DeleteOrganization extends SunodoCommand {
    static description = "Delete organization";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static args = { name: Args.string({ required: true }) };

    public async run(): Promise<void> {
        const { args } = await this.parse(DeleteOrganization);
        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);

        const deleteOrganization = fetcher
            .path("/orgs/{slug}")
            .method("delete")
            .create();

        const spinner = ora("Deleting organization...").start();
        try {
            await deleteOrganization({ slug: args.name });
            spinner.succeed(`Organization deleted: ${c.red(args.name)}`);
        } catch (e) {
            if (e instanceof deleteOrganization.Error) {
                spinner.fail(
                    `Error deleting organization: ${c.red(
                        e.getActualType().data.message
                    )}`
                );
            }
        }
    }
}
