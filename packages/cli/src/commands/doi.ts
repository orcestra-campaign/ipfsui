import { Command } from "commander";
import { withHelia } from "../configureHelia.js";
import { type Helia } from "helia";
import cid2stac from "../cid2stac.js";
import { publishDatacite } from "../datacite.js";
import { CID } from "multiformats";
import { stac2datacite, type DataCitePublisher } from "@orcestra/utils";
import * as yaml from 'js-yaml';
import * as fs from "node:fs/promises";

interface PublisherMeta {
  api: string;
  prefix: string;
  meta: {
    publisher: DataCitePublisher,
  };
}

function isPublisherMeta(obj: any): obj is PublisherMeta {
  return (
    "api" in obj && typeof obj.api === "string" &&
    "prefix" in obj && typeof obj.prefix === "string" &&
    "meta" in obj && "publisher" in obj.meta && typeof obj.meta.publisher === "object"
  );
}

async function readPublisherMeta(filename: string): Promise<PublisherMeta | undefined > {
  const raw_content = await fs.readFile(filename, {encoding: "utf-8"});
  const decoded = yaml.load(raw_content);
  if (isPublisherMeta(decoded)) {
    return decoded;
  }
  return undefined;
}


const urlPrefix = "https://browser.orcestra-campaign.org/#/ds/ipfs://";

function buildDOI(cid: CID, prefix: string) {
  return prefix + "/" + cid.toV1().toString();
}

function createDoiMeta(cid: CID, prefix: string, publicationYear: string) {
  return {
    doi: buildDOI(cid, prefix),
    url: urlPrefix + cid.toV1().toString(),
    publicationYear,
    alternateIdentifiers: [{
      alternateIdentifier: cid.toV1().toString(),
      alternateIdentifierType: "IPFS",
    }],
  };
}

function baseMeta(cid: CID, publicationYear: string, publisher: PublisherMeta) {
  return {
    ...publisher.meta,
    ...createDoiMeta(cid, publisher.prefix, publicationYear),
  };
}

async function cid2datacite(cid: CID, publicationYear: string, publisher: PublisherMeta, helia: Helia) {
  const stac = await cid2stac(cid, helia);
  return stac2datacite(stac, baseMeta(cid, publicationYear, publisher));
}

export default function makeDOICommand(doiCommand: Command) {
  doiCommand.description("DOI handling");

  doiCommand.command("get-meta")
    .description("get DataCite metadata")
    .requiredOption('--cid <CID>', 'dataset CID')
    .requiredOption('--publicationYear <year>', 'publication year')
    .requiredOption('--publisher <publisher.yaml>', 'publisher description file')
    .action(async (options: { cid: string, publicationYear: string, publisher: string}) => {
      await withHelia(async (helia) => {
        const cid = CID.parse(options.cid);
        const publisher = await readPublisherMeta(options.publisher);
        if (publisher === undefined) {
          console.log("ERROR: publisher.yaml can't be parsed!");
          return;
        }
        const doimeta = await cid2datacite(cid, options.publicationYear, publisher, helia);
        process.stdout.write(JSON.stringify(doimeta));
      })
    });

  doiCommand.command("register")
    .description("register DOI")
    .requiredOption('--cid <CID>', 'dataset CID')
    .requiredOption('--publicationYear <year>', 'publication year')
    .requiredOption('--publisher <publisher.yaml>', 'publisher description file')
    .action(async (options: { cid: string, publicationYear: string, publisher: string }) => {
      await withHelia(async (helia) => {
        const cid = CID.parse(options.cid);
        const publisher = await readPublisherMeta(options.publisher);
        if (publisher === undefined) {
          console.log("ERROR: publisher.yaml can't be parsed!");
          return;
        }
        const doimeta = await cid2datacite(cid, options.publicationYear, publisher, helia);
        await publishDatacite(publisher.api, doimeta);
      })
    });

  doiCommand.command("publish")
    .summary("publish DOI")
    .description(`Publish an existing DOI. This is NOT REVOCABLE`)
    .requiredOption('--cid <CID>', 'dataset CID')
    .requiredOption('--publisher <publisher.yaml>', 'publisher description file')
    .action(async (options: { cid: string, publisher: string }) => {
      const cid = CID.parse(options.cid);
      const publisher = await readPublisherMeta(options.publisher);
      if (publisher === undefined) {
        console.log("ERROR: publisher.yaml can't be parsed!");
        return;
      }
      await publishDatacite(publisher.api, {doi: buildDOI(cid, publisher.prefix), event: "publish"});
    })
}
