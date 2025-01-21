<script setup lang="ts">
import ItemView from './ItemView.vue';

const item = {
    properties: {
        "title": "TerraVerde",  // title
        "description": `TerraVerde is a comprehensive Earth observation dataset containing satellite imagery and derived products from 2015 to 2022. The dataset comprises a diverse range of variables, including surface reflectance, land cover, vegetation indices, temperature, and precipitation. With a spatial resolution of 10 meters for surface reflectance and 0.1 degrees for temperature and precipitation, TerraVerde provides a detailed and accurate representation of the Earth's surface.

The dataset includes a wide range of spectral bands, including blue, green, red, near-infrared, short-wave infrared, and thermal infrared. The surface reflectance product is derived from the satellite's sensor data and is corrected for atmospheric effects, providing a reliable and consistent measure of the Earth's surface reflectance. The land cover product is classified into 16 distinct categories, including forests, grasslands, urban areas, and water bodies.

TerraVerde also includes a range of vegetation indices, including NDVI, NDWI, and SAVI, which are derived from the surface reflectance product. These indices provide valuable information on vegetation health, biomass, and productivity. The temperature product includes daily and monthly temperature anomalies for the 2-meter air temperature product, while the precipitation product includes daily and monthly precipitation totals for the 0.1-degree resolution product.
        `,  // summary
        "keywords": ["example", "STAC"],  // keywords
        "license": "CC0",  // license
        "contacts": [  // could maybe also be providers from standard metadata ?
            {
                name: "John Doe",  // creator_name
                emails: ["john.doe@example.com"], // creator_email
            }
        ],
        "platform": "thin_air", // platform
        "mission": "ORCESTRA", // project (STAC doesn't allow multiple entries here...)
        // source
        "processing:lineage": "first ideas written down, published to production", // history
        // references
        "cube:dimensions": {
            time: {
                type: "temporal",
                extent: ["2024-08-01", "2024-09-30"],
            }
        },
        "cube:variables": {
            time: {
                dimensions: ["time"],
            },
            temperature: {
                dimensions: ["time"],
            }
        },
        "sci:citation": "Please refer to https://orcestra-campaign.org.",  //maybe also attribution
    }
};

</script>

<template>
    <ItemView :item="item" />
</template>

<style scoped>
</style>