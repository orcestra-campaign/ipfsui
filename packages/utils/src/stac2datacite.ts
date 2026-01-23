import { DataCiteMetadata, Publisher, Rights, GeoLocation, Description, Date, AlternateIdentifier } from "./datacite.js";
import { StacItem } from "./stac.js";
import spdxLicenses from "./licenses.json" with {type: "json"};

const spdx2info = Object.fromEntries(spdxLicenses.licenses.map(l => [l.licenseId, { name: l.name, uri: l.reference }]));

interface DOIPublicationData {
  doi: string,
  url: string,
  publisher: Publisher,
  publicationYear: string,
  dates?: Date[],
  alternateIdentifiers?: AlternateIdentifier[],
}

function getStacDates(stac: StacItem): Date[] {
  if (stac.properties?.start_datetime && stac.properties?.end_datetime) {
    return [{
      date: stac.properties.start_datetime + "/" + stac.properties.end_datetime,
      dateType: "Coverage",
    }]
  }
  if (stac.properties?.datetime) {
    return [{
      date: stac.properties.datetime,
      dateType: "Coverage",
    }]
  }
  return [];
}

function getStacFormat(stac: StacItem): string[] {
  return Object.values(stac.assets).map((a) => a?.type).filter((a) => a !== undefined);
}

function getStacRights(stac: StacItem): Rights[] {
  if (!stac.properties?.license) {
    return [];
  }
  const spdxInfo = spdx2info[stac.properties.license];
  if (!spdxInfo) {
    return [];
  }
  return [{
    rights: spdxInfo.name,
    rightsURI: spdxInfo.uri,
    rightsIdentifier: stac.properties.license,
    rightsIdentifierScheme: "SPDX",
    schemeURI: "https://spdx.org/licenses/"
  }]
}

function getStacDescription(stac: StacItem): Description[] {
  if (!stac?.properties?.description) {
    return [];
  }
  return [
    {
      description: stac.properties.description,
      descriptionType: "Abstract",  //TODO: could this be a different type?
    }
  ]
}

function getStacGeoLocation(stac: StacItem): GeoLocation[] {
  if (!stac?.bbox) {
    return [];
  }
  return [{
    geoLocationBox: {
      westBoundLongitude: stac.bbox[0],
      southBoundLatitude: stac.bbox[1],
      eastBoundLongitude: stac.bbox[2],
      northBoundLatitude: stac.bbox[3],
    }
  }]
}

export function stac2datacite(stac: StacItem, base: DOIPublicationData): DataCiteMetadata {
  return {
    ...base,
    titles: [
      {title: stac.properties.title!},
    ],
    creators: stac.properties.contacts!.map(c => ({
      name: c.name,
      nameType: "Personal",
      nameIdentifiers: [],  // TODO: have identifiers
      affiliation: [],  // TODO: have affiliation
    })),
    dates: (base?.dates || []).concat(getStacDates(stac)),
    types: {
      resourceType: "Dataset",
      resourceTypeGeneral: "Dataset",
    },
    formats: getStacFormat(stac),
    rightsList: getStacRights(stac),
    descriptions: getStacDescription(stac),
    geoLocations: getStacGeoLocation(stac),
  }
}
