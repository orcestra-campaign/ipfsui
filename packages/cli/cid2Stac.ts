import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { CID } from "multiformats";
import configureHelia from "./configureHelia";
import { getStore, setLogger, getLogger, NullLogger, stacFromStore } from "@orcestra/utils";

const options = [
  { name: "help", alias: "h", type: Boolean, description: "show this help" },
  {
    name: "cid",
    type: String,
    typeLabel: "{underline CID}",
    description: "root CID to scan for datasets",
  },
  {
    name: "cachedir",
    alias: "C",
    type: String,
    typeLabel: "{underline some/folder}",
    description: "cache directory",
  },
];


const sections = [
  {
    header: "dataset metadata scanner",
    content: "Scans for zarr datasets on IPFS.",
  },
  {
    header: "Options",
    optionList: options,
  },
];

const args = commandLineArgs(options);
if (args?.help) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
}

if (args?.cid === undefined) {
  console.error("please specify a --cid");
  process.exit(-1);
}

setLogger(new NullLogger());

const logger = getLogger();
logger.info(logger);

const cid = CID.parse(args.cid);
const helia = await configureHelia();
const store = getStore("ipfs://" + cid.toString(), { helia });
const stac = await stacFromStore(store, { src: "ipfs://" + cid.toString(), item_cid: cid });

process.stdout.write(JSON.stringify(stac));
helia.stop();
