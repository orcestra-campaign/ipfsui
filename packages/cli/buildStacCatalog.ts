import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import process from "node:process";
import { StacItem } from "../src/utils/stac.ts";

const options = [
  { name: "help", alias: "h", type: Boolean, description: "show this help" },
  {
    name: "infile",
    alias: "i",
    type: String,
    typeLabel: "{underline products.json}",
    description: "concatenated stac items",
  },
  {
    name: "outfolder",
    alias: "o",
    type: String,
    typeLabel: "{underline output}",
    description: "output folder to write full STAC catalog",
  },
];

const sections = [
  {
    header: "STAC catalog builder",
    content: "Expands stac catalog from concatenated items",
  },
  {
    header: "Options",
    optionList: options,
  },
];

const args = commandLineArgs(options);
if (args?.help || args.infile === undefined || args.outfolder === undefined) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
}

const items = JSON.parse(await Deno.readTextFile(args.infile)) as StacItem[];

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

await Deno.mkdir(args.outfolder + "/items", { recursive: true });
await Deno.writeTextFile(
  args.outfolder + "/catalog.json",
  JSON.stringify(catalog),
);
for (const item of items) {
  await Deno.writeTextFile(
    args.outfolder + "/" + id2path(item.id),
    JSON.stringify(item),
  );
}
