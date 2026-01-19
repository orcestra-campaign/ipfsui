import { Command } from "commander";
import { withHelia } from "../configureHelia.js";
import cid2stac from "../cid2stac.js";

export default function makeStacCommand(stacCommand: Command) {
  stacCommand.description("STAC handling");
  stacCommand.command("get-meta")
  .description("get STAC metadata")
  .requiredOption('--cid <CID>', 'dataset CID')
  .action(async (options: {cid: string}) => {
    await withHelia(async (helia) => {
      const stac = await cid2stac(options.cid, helia);
      process.stdout.write(JSON.stringify(stac));
    })
  })
}
