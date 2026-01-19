export interface NameIdentifier {
  schemeUri?: string,
  nameIdentifier: string,
  nameIdentifierScheme: "ORCID" | "ISNI" | "ROR",
}

export interface Affiliation {
  name: string,
  schemeUri?: string,
  affiliationIdentifier: string,
  affiliationIdentifierScheme: "ORCID" | "ISNI" | "ROR",
}

export interface Creator {
  name: string,
  nameType?: "Organizational" | "Personal",
  givenName?: string,
  familyName?: string,
  nameIdentifiers: NameIdentifier[],
  affiliation: Affiliation[],
}

export interface Title {
  title: string,
  lang?: string,
  titleType?: "AlternativeTitle" | "Subtitle" | "TranslatedTitle" | "Other"
}

interface BasePublisher {
  name: string,
  lang?: string
}

interface PublisherWithId extends BasePublisher {
  publisherIdentifier: string,
  publisherIdentifierScheme: "ROR" | "re3data" | "VIAF" | "Wikidata" | "Crossref Funder ID" | "ISNI" | "OpenDOAR" | "FAIRsharing" | "ISSN",
  schemeURI?: string,
}

export type Publisher = BasePublisher | PublisherWithId;

export interface Date {
  date: string,
  dateType: "Accepted" | "Available" | "Copyrighted" | "Collected" | "Coverage" | "Created" | "Issued" | "Submitted" | "Updated" | "Valid" | "Withdrawn" | "Other",
  dateInformation?: string,
}

export interface ResourceType {
  resourceType: string,
  resourceTypeGeneral:
      "Audiovisual" |
      "Award" |
      "Book" |
      "BookChapter" |
      "Collection" |
      "ComputationalNotebook" |
      "ConferencePaper" |
      "ConferenceProceeding" |
      "DataPaper" |
      "Dataset" |
      "Dissertation" |
      "Event" |
      "Image" |
      "InteractiveResource" |
      "Instrument" |
      "Journal" |
      "JournalArticle" |
      "Model" |
      "OutputManagementPlan" |
      "PeerReview" |
      "PhysicalObject" |
      "Preprint" |
      "Project" |
      "Report" |
      "Service" |
      "Software" |
      "Sound" |
      "Standard" |
      "StudyRegistration" |
      "Text" |
      "Workflow" |
      "Other"
}

export interface AlternateIdentifier {
  alternateIdentifierType: string,
  alternateIdentifier: string,
}

export interface Rights {
  rights: string,
  rightsURI?: string,
  rightsIdentifier?: string,
  rightsIdentifierScheme?: "SPDX", // maybe add more if needed
  schemeURI?: string,
}

interface GeoPlace {
  geoLocationPlace: string,
}

interface GeoPoint extends Partial<GeoPlace> {
  geoLocationPoint: {
    pointLatitude: number,
    pointLongitude: number
  }
}

interface GeoBox extends Partial<GeoPlace> {
  geoLocationBox: {
    eastBoundLongitude: number,
    northBoundLatitude: number,
    southBoundLatitude: number,
    westBoundLongitude: number
  }
}

interface GeoPolygon extends Partial<GeoPlace> {
  geoLocationPolygon: {
    polygonPoint: {
      pointLatitude: number,
      pointLongitude: number
    }
  }[]
}

export type GeoLocation = GeoPoint | GeoBox | GeoPolygon;

export interface Description {
  descriptionType: "Abstract" | "Methods" | "SeriesInformation" | "TableOfContents" | "TechnicalInfo" | "Other",
  description: string,
  lang?: string,
}

export interface DataCiteMetadata {
  doi: string,
  creators: Creator[],
  titles: Title[],
  publisher: Publisher,
  publicationYear: string,
  dates?: Date[],
  types: ResourceType,
  url: string,
  alternateIdentifiers?: AlternateIdentifier[],
  formats?: string[],
  rightsList?: Rights[],
  descriptions?: Description[],
  geoLocations?: GeoLocation[],
}

export interface DOISEvent extends DataCiteMetadata {
  event?: "publish" | "register" | "hide",
}

export interface DOISData {
  type: "dois",
  attributes: DOISEvent,
}
