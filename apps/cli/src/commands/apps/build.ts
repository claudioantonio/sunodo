import ora from "ora";
import c from "ansi-colors";
import Docker from "dockerode";

import { SunodoCommand } from "../../sunodoCommand.js";
import { createApplication } from "../../services/sunodo.js";
import { Args, Flags } from "@oclif/core";

export default class BuildApplication extends SunodoCommand {
    static description = "Build application";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static args = { name: Args.string() };

    static flags = {
        org: Flags.string({
            description: "organization slug of the application",
        }),
    };

    public async run(): Promise<void> {
        const { args } = await this.parse(BuildApplication);
        const { flags } = await this.parse(BuildApplication);

        const spinner = ora("Building application...").start();
        try {
            const docker = new Docker();
            const version = await docker.version();
            this.log(`Using Docker ${version.Version}`);

            const i = await docker.buildImage(".");
            spinner.succeed(`Application built`);
        } catch (e) {
            if (e instanceof Error) {
                spinner.fail(`Error building application: ${c.red(e.message)}`);
            }
        }
    }
}
