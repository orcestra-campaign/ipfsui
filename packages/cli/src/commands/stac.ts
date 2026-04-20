import { Command } from "commander";
import { withHelia } from "../configureHelia.js";
import cid2stac from "../cid2stac.js";
import { StacItem } from "@orcestra/utils";

import * as fs from "node:fs/promises";

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
    
  stacCommand.command("write-catalog")
  .description("write STAC catalog from products.json")
  .requiredOption('-i --infile <products.json>', 'products.json (e.g. from index scan) ')
  .requiredOption('-o --outfolder <folder>', 'output folder for generated stac catalog')
  .action(async (options: {infile: string, outfolder: string}) => {
      const items = JSON.parse(await fs.readFile(options.infile, {encoding: "utf-8"})) as StacItem[];

      const id2path = (id: string) => "items/" + id + ".json";

      const catalog = {
        type: "Catalog",
        stac_version: "1.1.0",
        stac_extensions: [],
        id: "orcestra_products",
        title: "ORCESTRA products catalog",
        description: "Catalog for ORCESTRA campaign data",
        links: items.map((item) => {
          return {
            href: id2path(item.id),
            rel: "item",
            type: "application/geo+json",
            title: item.properties?.title,
          };
        }),
      };

      await fs.mkdir(options.outfolder + "/items", { recursive: true });
      await fs.writeFile(options.outfolder + "/catalog.json", JSON.stringify(catalog), {encoding: "utf-8"});
      for (const item of items) {
        await fs.writeFile(options.outfolder + "/" + id2path(item.id), JSON.stringify(item), {encoding: "utf-8"});
      }
  })
}
