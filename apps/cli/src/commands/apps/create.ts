import ora from "ora";
import c from "ansi-colors";
import { Args, Flags } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";
import { paths } from "../../services/sunodo";
import { SunodoCommand } from "../../sunodoCommand.js";

export default class CreateApplication extends SunodoCommand {
    static description = "Create application";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static args = { name: Args.string() };

    static flags = {
        org: Flags.string({
            description: "organization slug of the application",
        }),
    };

    public async run(): Promise<void> {
        const { args } = await this.parse(CreateApplication);
        const { flags } = await this.parse(CreateApplication);

        const spinner = ora("Creating application...").start();
        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);

        const createApplication = fetcher
            .path("/apps/")
            .method("post")
            .create();

        try {
            const { data } = await createApplication({
                name: args.name,
                org: flags.org,
            });
            spinner.succeed(`Application created: ${c.cyan(data.name)}`);
        } catch (e) {
            if (e instanceof createApplication.Error) {
                const error = e.getActualType();
                spinner.fail(
                    `Error creating application: ${c.red(error.data.message)}`
                );
            }
        }
    }
}
