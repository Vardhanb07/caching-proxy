#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import app from "./server.js";

program.version("1.0.0").description("caching-proxy");
program
  .option("-p, --port <number>", "Add port")
  .option("-o, --origin <string>", "Add url")
  .action((options) => {
    if (options.port && options.origin) {
      app.listen(options.port, () => {
        console.log(chalk.green(`localhost: http://localhost:${options.port}`));
      });
    }
  });

program.parse(process.argv);
