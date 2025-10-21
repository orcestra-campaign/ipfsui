<script setup lang="ts">
import Nav from './Nav.vue';
</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
        </div>
    </div>
    <h1>Privacy Policy</h1>
    <p>
    This website does not use cookies and does not collect any personal data directly.
    However, certain features rely on third-party services that may process limited technical information (such as your IP address) to function properly.
    </p>

    <h2>Website Hosting</h2>
    <p>
    This website is hosted on <a href="https://pages.github.com/" target="_blank" rel="noopener">GitHub Pages</a>,
    a service provided by <a href="https://github.com/" target="_blank" rel="noopener">GitHub, Inc.</a>.
    When you access this website, your browser sends standard web request information
    (such as your IP address, browser type, and time of access) to GitHub’s servers.
    GitHub may process this data to operate and secure its hosting platform,
    in accordance with the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a>.
    </p>

    <h2>IPFS</h2>
    <p>
    The ORCESTRA Data Browser retrieves data via the <a href="https://ipfs.tech/" target="_blank" rel="noopener">InterPlanetary File System (IPFS)</a>,
    a peer-to-peer network that enables decentralized data distribution.
    When accessing data through IPFS, your browser may connect to several nodes on the network,
    including public gateways or delegated routing services.
    These connections may expose your IP address to the servers involved.
    </p>

    <h2>Stadia Maps</h2>
    <p>
    Geospatial data displayed on this website may use interactive maps powered by
    <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a>.
    Map tiles are fetched directly from Stadia’s servers, which means your IP address and basic request information
    (e.g., browser type, time of access) may be processed by Stadia to deliver the map content.
    For details, see the <a href="https://stadiamaps.com/privacy/" target="_blank" rel="noopener">Stadia Maps Privacy Policy</a>.
    </p>
</template>
