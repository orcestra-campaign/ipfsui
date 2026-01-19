# ORCESTRA data browser

This repository contains the [ORCESTRA data browser](https://browser.orcestra-campaign.org/).

The project contains several `packages`.

* `utils`: common utility functions
* `cli`: command line tools, mainly for index handling
* `ui`: the browser user interface as Vue 3 based web application

## local development

We use node and npm. Use the following command to install all dependencies:

```bash
npm install
```

You might also want to (re-) build the `utils` package, as this is required for the others to work.

```bash
cd packages/utils
npm run build
```

## Web UI

You can then run your own local development server for the UI using:

```bash
cd packages/ui
npm run dev
```

## indexing

In order to display the main page quickly, we have to generate an index of the
existing dataset. There's a tool to create such an index based on an IPFS unixfs
folder.

### collecting the index

The indexing tool expects a CID to build the index. You may want to find it
using:

```bash
ipfs resolve /ipns/latest.orcestra-campaign.org/products
```

Which returns `/ipfs/<CID>`. Using only the `<CID>` part, you can now build an
index like so:

```bash
cd packages/cli
npm run build
npm link
dito index scan -- --cid <CID> -o products.json -C cache
```

(`-C` is optional and specifies a directory for caching items)

**NOTE:** the tool will try to figure out if you have an IPFS gateway configured
loally an will use it if present. In case it doesn't find the gateway, it will
run it's own IPFS node, but that might be slower than using a well-connected
long-running node as gateway.

### compress the index

Currently, we use the array of stac items as index for the main page (as
produced by the scanning tool). This can quickly become large, especially when
including trajectory data. A hacky way to compress the index can be done using
`jq`:

```bash
cat products.json | jq 'map({properties, assets})' > products_short.json
```
