import { test, expect } from "vitest";
import cid2stac from "../src/cid2stac.ts";
import { withHelia, default as configureHelia } from "../src/configureHelia.ts";

test("stac extracts title", async () => await withHelia(async (helia) => {
  const stac = await cid2stac("bafybeiesyutuduzqwvu4ydn7ktihjljicywxeth6wtgd5zi4ynxzqngx4m", helia);
  expect(stac.properties.title).toContain('BEACH dropsonde dataset (Level 3)');
}), 10000);
