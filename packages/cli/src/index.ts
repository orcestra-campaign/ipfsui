#!/usr/bin/env node

import { Command } from "commander";
import { setLogger, NullLogger } from "@orcestra/utils";
import makeStacCommand from "./commands/stac.js";
import makeIndexCommand from "./commands/index.js";

setLogger(new NullLogger());

const main = new Command();

main
  .name("dito")
  .description("Dataset Indexing Tool")
  .version("0.0.1");

makeIndexCommand(main.command("index"));
makeStacCommand(main.command("stac"));

await main.parseAsync();
