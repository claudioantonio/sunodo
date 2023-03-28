import ora from "ora";
import c from "ansi-colors";
import { Args, Flags } from "@oclif/core";
import { Fetcher } from "@cuppachino/openapi-fetch/dist/esm";

import { SunodoCommand } from "../../sunodoCommand.js";
import { paths } from "../../services/sunodo.js";

export default class CreateOrganization extends SunodoCommand {
    static description = "Create organization";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static args = { name: Args.string({ required: true }) };

    static flags = {
        slug: Flags.string({
            description: "slug of the organization",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        const { args } = await this.parse(CreateOrganization);
        const { flags } = await this.parse(CreateOrganization);

        const fetcher = Fetcher.for<paths>();
        fetcher.configure(this.fetchConfig);
        const createOrganization = fetcher
            .path("/orgs/")
            .method("post")
            .create();

        const spinner = ora("Creating application...").start();
        try {
            const { data } = await createOrganization({
                name: args.name,
                slug: flags.slug,
            });
            spinner.succeed(`Application created: ${c.cyan(data.name)}`);
        } catch (e) {
            if (e instanceof createOrganization.Error) {
                spinner.fail(
                    `Error creating application: ${c.red(
                        e.getActualType().data.message
                    )}`
                );
            }
        }
    }
}
