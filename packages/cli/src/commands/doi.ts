import { Command } from "commander";
import { withHelia } from "../configureHelia.js";
import cid2stac from "../cid2stac.js";
import { CID } from "multiformats";
import { stac2datacite } from "@orcestra/utils";


//TODO: this static information should be read in from a configuration file
const publisherMeta = {
  publisher: {
    name: "Max Planck Institute for Meteorology",
    lang: "en",
    publisherIdentifier: "https://ror.org/05esem239",
    publisherIdentifierScheme: "ROR",
    schemeURI: "https://ror.org/",
  }
};
const doiPrefix = "10.83509/";
const urlPrefix = "https://browser.orcestra-campaign.org/#/ds/ipfs://";


function createDoiMeta(cid: CID, publicationYear: string) {
  return {
    doi: doiPrefix + cid.toV1().toString(),
    url: urlPrefix + cid.toV1().toString(),
    publicationYear,
    alternateIdentifiers: [{
      alternateIdentifier: cid.toV1().toString(),
      alternateIdentifierType: "IPFS",
    }],
  };
}

function baseMeta(cid: CID, publicationYear: string) {
  return {
    ...publisherMeta,
    ...createDoiMeta(cid, publicationYear),
  };
}

export default function makeDOICommand(doiCommand: Command) {
  doiCommand.description("DOI handling");

  doiCommand.command("get-meta")
    .description("get DataCite metadata")
    .requiredOption('--cid <CID>', 'dataset CID')
    .requiredOption('--publicationYear <year>', 'publication year')
    .action(async (options: { cid: string, publicationYear: string }) => {
      await withHelia(async (helia) => {
        const cid = CID.parse(options.cid);
        const stac = await cid2stac(cid, helia);
        const doimeta = stac2datacite(stac, baseMeta(cid, options.publicationYear));
        process.stdout.write(JSON.stringify(doimeta));
      })
    });

  doiCommand.command("register")
    .description("register DOI");
}
