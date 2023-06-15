import { Command, Flags, loadHelpClass } from "@oclif/core";
import path from "path";
import fs from "fs-extra";
import Handlebars from "handlebars";

export default class Docs extends Command {
    static summary = "Generate documentation for the CLI.";

    static description =
        "Process a set of handlebars templates with information from the CLI commands with the goal to generate documentation.";

    static examples = ["<%= config.bin %> <%= command.id %>"];

    static hidden = true;

    static flags = {
        "template-dir": Flags.directory({
            description: "The directory containing the handlebars templates.",
            required: true,
        }),
        "output-dir": Flags.directory({
            description: "The directory to output the generated files to.",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(Docs);

        const config = this.config;
        const HelpClass = await loadHelpClass(config);
        const help = new HelpClass(config, {
            stripAnsi: true,
            maxWidth: 120,
        });

        const templateDir = flags["template-dir"];
        const outputDir = flags["output-dir"];
        fs.ensureDirSync(outputDir);

        const templateFiles = await fs.readdir(templateDir);
        const templateData = {
            commands: this.config.commands.map((command) => {
                return {
                    id: command.id,
                    description: command.description,
                    examples: command.examples,
                    aliases: command.aliases,
                    hidden: command.hidden,
                    type: command.type,
                    flags: command.flags,
                };
            }),
        };

        this.log(`processing templates from ${templateDir} to ${outputDir}`);
        await Promise.all(
            templateFiles.map(async (templateFile) => {
                const template = await fs.readFile(
                    path.join(templateDir, templateFile),
                    "utf-8"
                );
                const outputFile = templateFile.replace(/\.hbs$/, "");
                this.log(`processing ${templateFile} -> ${outputFile}`);
                const compiledTemplate = Handlebars.compile(template);
                const output = compiledTemplate(templateData);

                await fs.writeFile(path.join(outputDir, outputFile), output);
            })
        );
    }
}
