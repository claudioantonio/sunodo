import ora from "ora";
import c from "ansi-colors";
import { Args } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";

import { SunodoCommand } from "../../sunodoCommand.js";
import { paths } from "../../services/sunodo.js";

export default class DeleteApplication extends SunodoCommand {
    static description = "Delete application";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static args = { name: Args.string({ required: true }) };

    public async run(): Promise<void> {
        const { args } = await this.parse(DeleteApplication);

        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);
        const deleteApplication = fetcher
            .path("/apps/{name}")
            .method("delete")
            .create();

        const spinner = ora("Deleting application...").start();
        try {
            await deleteApplication(args);
            spinner.succeed(`Application deleted: ${c.red(args.name)}`);
        } catch (e) {
            if (e instanceof deleteApplication.Error) {
                spinner.fail(
                    `Error deleting application: ${c.red(
                        e.getActualType().data.message
                    )}`
                );
            }
        }
    }
}
