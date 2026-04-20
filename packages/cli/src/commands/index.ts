import { Command } from "commander";
import { withHelia } from "../configureHelia.js";
import { CID } from "multiformats";
import { unixfs } from "@helia/unixfs";
import cid2stac from "../cid2stac.js";
import { getStacCache } from "../stacCache.js";
import { getItemCIDCache } from "../itemCIDCache.js";
import { collectDatasets } from "../scanMetadata.js";
import * as fs from "node:fs/promises";

export default function makeIndexCommand(indexCommand: Command) {
  indexCommand.description("index creation");

  indexCommand.command("scan")
    .description("scan CID recursively for datasets and build index")
    .requiredOption("--cid <CID>", "root CID")
    .option("-o --outfile <file>", "output file (containing stac items)")
    .option("-C --cachedir <folder>", "cache directory")
    .action(async (options: { cid: string, outfile?: string, cachedir?: string}) => {
      await withHelia(async (helia) => {
        const ipfs_fs = unixfs(helia);
        const cid = CID.parse(options.cid);
        const stacCache = getStacCache(options.cachedir);
        const itemCIDCache = getItemCIDCache(options.cachedir);
        const datasetLocations = await collectDatasets(cid, ipfs_fs, {cache: itemCIDCache});
        console.log("all datasets collected, extracting metadata");
        const stacItems = await Promise.all(
          datasetLocations.map(async ({ cid }) => {
            const stacItem = await cid2stac(cid, helia, stacCache);
            console.log(stacItem?.properties?.title);
            return stacItem;
          }),
        );

        if (options?.outfile !== undefined) {
          await fs.writeFile(options.outfile, JSON.stringify(stacItems), {encoding: "utf-8"});
        }
      })
    });
}
