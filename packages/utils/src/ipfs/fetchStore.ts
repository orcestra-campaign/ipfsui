import { type Helia } from "helia";
import type { AbsolutePath, AsyncReadable, RangeQuery } from "./types";
import { fetch_range, merge_init } from "./utils";
import {
  createVerifiedFetch,
  type VerifiedFetch,
  verifiedFetch,
} from "@helia/verified-fetch";

function resolve(root: string | URL, path: AbsolutePath): URL {
  const base = typeof root === "string" ? new URL(root) : root;
  if (!base.pathname.endsWith("/")) {
    // ensure trailing slash so that base is resolved as _directory_
    base.pathname += "/";
  }
  const resolved = new URL(path.slice(1), base);
  // copy search params to new URL
  resolved.search = base.search;
  return resolved;
}

async function handle_response(
  response: Response,
): Promise<Uint8Array | undefined> {
  if (response.status === 404) {
    return undefined;
  }
  if (response.status === 200 || response.status === 206) {
    return new Uint8Array(await response.arrayBuffer());
  }
  throw new Error(
    `Unexpected response status ${response.status} ${response.statusText}`,
  );
}

async function fetch_suffix(
  url: string,
  suffix_length: number,
  init: RequestInit,
  use_suffix_request: boolean,
  verifiedFetch: VerifiedFetch,
): Promise<Response> {
  if (use_suffix_request) {
    return verifiedFetch(url);
  }
  const response = await verifiedFetch(url);
  if (!response.ok) {
    // will be picked up by handle_response
    return response;
  }
  const content_length = response.headers.get("Content-Length");
  const length = Number(content_length);
  return fetch_range(url, length - suffix_length, length, init);
}

/**
 * Readonly store based in the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
 * Must polyfill `fetch` for use in Node.js.
 *
 * ```typescript
 * import * as zarr from "@zarrita/core";
 * const store = new FetchStore("http://localhost:8080/data.zarr");
 * const arr = await zarr.get(store, { kind: "array" });
 * ```
 */
class IPFSFetchStore implements AsyncReadable<RequestInit> {
  #overrides: RequestInit;
  #use_suffix_request: boolean;
  #getVerifiedFetch: () => Promise<VerifiedFetch>;

  constructor(
    public url: string | URL,
    options: {
      overrides?: RequestInit;
      useSuffixRequest?: boolean;
      helia?: Helia;
    } = {},
  ) {
    this.#overrides = options.overrides ?? {};
    this.#use_suffix_request = options.useSuffixRequest ?? false;
    if (options?.helia !== undefined) {
      let instance: VerifiedFetch;
      this.#getVerifiedFetch = async () => {
        if (instance === undefined) {
          instance = await createVerifiedFetch(options.helia);
        }
        return instance;
      };
    } else {
      this.#getVerifiedFetch = () => Promise.resolve(verifiedFetch);
    }
  }

  #merge_init(overrides: RequestInit) {
    return merge_init(this.#overrides, overrides);
  }

  async get(
    key: AbsolutePath,
    _options: RequestInit = {},
  ): Promise<Uint8Array | undefined> {
    const href = resolve(this.url, key).href;
    const verifiedFetch = await this.#getVerifiedFetch();
    const response = await verifiedFetch(href);
    return handle_response(response);
  }

  async getRange(
    key: AbsolutePath,
    range: RangeQuery,
    options: RequestInit = {},
  ): Promise<Uint8Array | undefined> {
    const url = resolve(this.url, key);
    const init = this.#merge_init(options);
    const verifiedFetch = await this.#getVerifiedFetch();
    let response: Response;
    if ("suffixLength" in range) {
      response = await fetch_suffix(
        url.href,
        range.suffixLength,
        init,
        this.#use_suffix_request,
        verifiedFetch,
      );
    } else {
      response = await fetch_range(url, range.offset, range.length, init);
    }
    return handle_response(response);
  }
}

export default IPFSFetchStore;
