<script setup lang="ts">
import Nav from './Nav.vue';
import Footer from './Footer.vue';
</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
        </div>
    </div>
    <h1>Page Not Found</h1>
    If you intended to inspect a dataset, try navigating to <code>#/ds/&lt;your dataset url&gt;</code>
    <Footer />
</template>
