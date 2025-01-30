# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript
in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the
[script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup)
to learn more.

Learn more about the recommended Project Setup and IDE Support in the
[Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

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

```
deno run -A cli/scanMetadata.ts --cid <CID> -o products.json
```

**NOTE:** the tool will try to figure out if you have an IPFS gateway configured
loally an will use it if present. In case it doesn't find the gateway, it will
run it's own IPFS node, but that might be slower than using a well-connected
long-running node as gateway.
