import { Command } from "commander";
import { withHelia } from "../configureHelia.js";
import { CID } from "multiformats";
import { unixfs } from "@helia/unixfs";
import cid2stac from "../cid2stac.js";
import { getStacCache } from "../stacCache.js";
import { getItemCIDCache } from "../itemCIDCache.js";
import { collectDatasets } from "../scanMetadata.js";
import { TreeMonitor, NoMonitor } from "../scanMonitor.js";
import {
  readPinlist,
  excludeSupersededEntries,
  filterByTags,
  excludeByTags,
} from "../pinlist.js";
import * as fs from "node:fs/promises";

export default function makeIndexCommand(indexCommand: Command) {
  indexCommand.description("index creation");

  indexCommand.command("scan")
    .description("scan CID(s) recursively for datasets and build index")
    .option("--cid <CID>", "root CID (mutually exclusive with --pinlist)")
    .option("--pinlist <file>", "pinlist.yaml describing multiple root CIDs (mutually exclusive with --cid)")
    .option("--tag <tag>", "only process pinlist entries with this tag (repeatable)", collectOption, [])
    .option("--exclude-tag <tag>", "skip pinlist entries with this tag (repeatable)", collectOption, [])
    .option("-o --outfile <file>", "output file (containing stac items)")
    .option("-C --cachedir <folder>", "cache directory")
    .option("--tree-monitor", "use tree monitor to show directory structure and timing")
    .action(async (options: {
      cid?: string,
      pinlist?: string,
      tag?: string[],
      excludeTag?: string[],
      outfile?: string,
      cachedir?: string,
      treeMonitor?: boolean,
    }) => {
      await withHelia(async (helia) => {
        const ipfs_fs = unixfs(helia);
        const stacCache = getStacCache(options.cachedir);
        const itemCIDCache = getItemCIDCache(options.cachedir);
        const monitor = options.treeMonitor ? new TreeMonitor() : new NoMonitor();

        let rootCids: CID[];

        if (options.pinlist !== undefined) {
          const pins = await readPinlist(options.pinlist);
          let selected = filterByTags(pins, options.tag ?? []);
          selected = excludeByTags(selected, options.excludeTag ?? []);
          selected = excludeSupersededEntries(selected)

          rootCids = selected.map((pin) => CID.parse(pin.cid));

          console.log(`processing ${rootCids.length} active root CIDs from pinlist`);
        } else if (options.cid !== undefined) {
          rootCids = [CID.parse(options.cid)];
        } else {
          console.error("ERROR: must provide either --cid or --pinlist");
          return;
        }

        const datasetLocations = (await Promise.all(
          rootCids.map((cid, index) =>
            collectDatasets(cid, ipfs_fs, {
              cache: itemCIDCache,
              monitor: monitor,
              path: index.toString()
            })
          )
        )).flat();

        // Clean up monitor if it was a TreeMonitor
        if (monitor instanceof TreeMonitor) {
          monitor.cleanup();
        }

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

function collectOption(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
