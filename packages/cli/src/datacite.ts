import type { DataCiteMetadata } from "@orcestra/utils";

interface PayloadAttributes extends Partial<DataCiteMetadata> {
  doi: string;
  event?: "publish" | "register" | "hide";
}

export async function publishDatacite(host: string, attributes: PayloadAttributes) {
  const username = process.env.DATACITE_USER;
  const password = process.env.DATACITE_PASSWORD;
  if (!username || !password) {
    console.error("DATACITE_USER and DATACITE_PASS must be set as environment variables!");
    process.exit(-1);
  }
  const token = Buffer.from(username + ":" + password, "utf-8").toString("base64");
  const payload = {
    data: {
      type: "dois",
      attributes,
    }
  };
  const response = await fetch(host + "/dois/" + attributes.doi, {
    method: "PUT",
    headers: {
      "Content-Type": "application/vnd.api+json",
      "Authorization": "Basic " + token,
    },
    body: JSON.stringify(payload),
  })
  return response;
}
