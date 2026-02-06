<script setup lang="ts">
import Nav from './Nav.vue';
</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
        </div>
    </div>
    <h1>About</h1>
    <p>
    This website is part of the IPFS data repository of the <a href="https://mpimet.mpg.de/" target="_blank" rel="noopener">Max Planck Institute for Meteorology</a>.
    The purpose of this repository is to provide a <emph>reliable, distributed platform to actively work on shared research data</emph> with a seamless <emph>archive attached</emph>.
    </p>
    <p>
    We use the <router-link to="#what_is_ipfs">InterPlanetary File System (IPFS)</router-link> to store and retrieve scientific datasets in a distributed and verifiable manner.
    Every dataset is identified by it's <router-link to="#what_is_a_cid">content identifier (CID)</router-link>, which contains a cryptographic hash of the referenced dataset itself.
    Thus, by knowing the CID, everyone can formally verify that a dataset has been retrieved unchanged.
    This verifiability enables everyone to potentially store and provide a copy of the data, thus providing redundancy without compromising integrity.
    </p>
    <p>
    While this website provides a human readable view on the datasets, the website itself is not the data repository, and doesn't store datasets by itself.
    Any user (including this website) can access the data directly through IPFS and thus doesn't have to rely on a single central service.
    </p>

    <h2>Questions and Answers</h2>
    <h3 id="mission_and_scope" class="link-target">What is the mission and scope of this repository?</h3>
    <p>
    This is a data repository for scientific research data, mainly from field campaigns with some involvement of the <a href="https://mpimet.mpg.de/" target="_blank" rel="noopener">Max Planck Institute for Meteorology</a>.
    As we usually partner with institutions around the world, the design of this repository is intentionally distributed and rather open, and we are happy partner with others, helping to broaden the scope.
    </p>
    <p>
    The repository is based on the idea, of having a reliable and stable way to <emph>identify, access and use research data all the way through from initial data capture to long-term archive</emph>.
    For us, this means, it should be possible to attach an actionable identifier to a dataset right after producing it, which might be somewhere out in the field.
    Immediately afterwards, this identifier can be used to work with the original data locally, and crucially, this identifier and access method should stay unchanged, ideally forever, despite the fact that data will have to move in the meantime.
    </p>
    <p>
    In order to reach this goal, we do two things:
    <ul>
        <li>We use <router-link to="#what_is_a_cid">content identifiers</router-link> instead of location based identifiers to ensure the dataset identifiers don't have to change over time, and data integrity can be verified by everyone.</li>
        <li>We, our friends and our partners operate a redundant set of storage nodes, thus ensuring that there'll always be an available copy of each indexed dataset.</li>
    </ul>
    </p>
    <h3 id="kinds_of_data" class="link-target">What kind of data is in this repository?</h3>
    <p>
    This is a repository for <emph>open data</emph>, in <router-link to="#mission_and_scope">scope of the repository</router-link>.
    Usually, this means data is licensed using some form of <a href="https://creativecommons.org/" target="_blank" rel="noopener">Creative Commons</a> license.
    This means, that data can usually be shared rather freely, and we explicitly encourage keeping and re-providing copies of the data using IPFS.
    In any case, please be sure to observe the individual licensing conditions in the metadata of each dataset.
    </p>
    <p>
    We currently have a strong preference for <a href="https://zarr.dev/" target="_blank" rel="noopener">Zarr</a> formatted datasets, following <a href="https://cfconventions.org/" target="_blank" rel="noopener">CF-</a> and <a href="https://wiki.esipfed.org/Attribute_Convention_for_Data_Discovery_1-3" target="_blank" rel="noopener">ACDD-</a> conventions.
    This data format is flexible and suitable for most data in our scientific domain, and it interacts nicely with the Merkle tree and our distributed storage.
    However, we also allow other datasets (e.g. for raw data formats) in form of a folder with a metadata file.
    </p>

    <h3 id="reliability" class="link-target">Which measures ensure continuous data (and metadata) availability?</h3>
    <p>
    We require that any metadata associated with a dataset is part of the dataset itself.
    This ensures that data and metadata can't become inconsistent and that both metadata and data can be distributed and verified in the same way, using a single <router-link to="#what_is_a_cid">CID</router-link>.
    In fact, our dataset landing pages are generated automatically on client-side: the user's web browsers fetches the metadata contained in the actual dataset and displays it.
    </p>
    <p>
    We make sure that data (and metadata) is stored in multiple locations and encourage collaborators and users to host further copies of the data.
    As the retrieval system is based on <router-link to="#what_is_ipfs">IPFS</router-link>, there's no single point of failure when accessing any data or metadata.
    Thus, even if an entire data center goes offline, the data (and metadata) is still accessible.
    This setup also facilitates data movement in case we have to hand the datasets over to a successor: the successor simply becomes another storage location and a previous storage location goes offline.
    As we identify datasets by <router-link to="#what_is_a_cid">CID</router-link>, the identifier is independent of the storage location(s).
    </p>
    <p>
    The website of the repository is itself just a static asset and thus does not require specific infrastructure to be run, and thus can easily be hosted by anyone.
    </p>
    <h3 id="is_website_holding_data" class="link-target">Is the website itself holding the data?</h3>
    <p>
    No.
    The website doesn't itself hold any datasets.
    Instead, the actual datasets (mostly their metadata) are retrieved through <router-link to="#what_is_ipfs">IPFS</router-link> on-demand by the browser, when opening a dataset landing page.
    This ensures that displayed and contained metadata can't be out of sync and demonstrates retrievability of the actual data.
    </p>

    <h3 id="where_is_the_data" class="link-target">But where is the data?</h3>
    <p>
    The data is stored distributed, on <router-link to="#what_is_ipfs">IPFS</router-link>.
    We, including our friends and partners, keep a set of larger IPFS nodes running.
    This includes nodes at the <a href="https://www.dkrz.de/" target="_blank" rel="noopener">DKRZ</a> and <a href="https://www.gwdg.de/" target="_blank" rel="noopener">GWDG</a> computing facilities, commercial providers as well as local nodes in research institutions.
    The IPFS protocols ensure that data referenced by <router-link to="#what_is_a_cid">CID</router-link> can be found, independent of where the data is actually stored.
    This distributed setup ensures that we won't loose access to any data, even in case of intermittent or permanent service interruptions in individual sites.
    </p>

    <p>
    On top, anyone can run and operate an IPFS node (e.g. <a href="https://docs.ipfs.tech/how-to/desktop-app/" target="_blank" rel="noopener">IPFS Desktop</a>, <a href="https://docs.ipfs.tech/how-to/kubo-basic-cli/" target="_blank" rel="noopener">Kubo CLI</a> and many more...).
    If you do, you can <router-link to="#what_is_pinning">pin</router-link> datasets of your interest, thus providing another copy of the data to the scientific community.
    Likely more important for your daily work, this will of course also improve data access for yourself, as you'd be accessing your local copy instead of re-downloading the data upon access.
    </p>

    <h3 id="what_is_ipfs" class="link-target">What is IPFS?</h3>
    The <a href="https://ipfs.tech/" target="_blank" rel="noopener">InterPlanetary File System (IPFS)</a> is a set of protocols and building blocks which allow to identify and share data in a trustless, distributed manner.
    IPFS uses the <a href="https://ipld.io/docs/" target="_blank" rel="noopener">IPLD</a> data model, which can be used to create data structures in form of a <a href="https://en.wikipedia.org/wiki/Merkle_tree" target="_blank" rel="noopener">Merkle tree</a>.
    We use the fact that the top hash of the Merkle tree (or root <router-link to="#what_is_a_cid">CID</router-link> in IPLD) can efficiently and securely verify the content below to ensure that our datasets remain unchanged.
    On top of the IPLD structures, IPFS provides protocols which help discovering data providers for requested data, only based on CID.
    We use IPFS to provide reliable and fault-tolerant access to the data in our repository.

    <h3 id="what_is_a_cid" class="link-target">What is a CID?</h3>
    <p>
    A <a href="https://docs.ipfs.tech/concepts/content-addressing/" target="_blank" rel="noopener">content identifier (CID)</a> identifies data by <emph>what</emph> it is, instead of where it is.
    This can be seen in contrast to a location based identifier like a path on a file system, or a URL.
    Think of this like you'd rather buy a book by <a href="https://en.wikipedia.org/wiki/ISBN"  target="_blank" rel="noopener">ISBN</a>, instead of by it's location on the bookshelf in your nearby library.
    </p>
    <p>
    A CID is constructed based on a cryptographic hash of the content.
    It adds to the hash some meta-information about the type of hash, the type of the referenced content and the encoding of the CID itself.
    By it's construction, the CID uniquely and persistently represents a specific bitwise representation of the content.
    Any change to the content will also result in a different CID.
    </p>
    <p>
    A <router-link to="#what_is_a_doi">DOI</router-link> as a similar scope, it is a (persistent) digital identifier of an object.
    A DOI is for any kind of object (not necessarily digital), and it is not based on the content of the referenced object.
    In order to make DOI resolution persistent, the DOI system relies on regular maintenance of the DOI data record, and puts trust in the DOI registrants to perform this maintenance.
    The DOI system however is quite open to other identifiers, and thus allows embedding of other identifiers within a DOI.
    We use this feature to literally embed CIDs into DOIs.
    This way, everyone can extract the CID from the DOI without depending on any metadata service and be able to externally verify the integrity of data referenced by our DOIs.
    </p>

    <h3 id="what_is_pinning" class="link-target">What is pinning?</h3>
    <p>
    <a href="https://docs.ipfs.tech/how-to/pin-files/" target="_blank" rel="noopener">Pinning</a> in the context of IPFS means: instructing a node to collect and keep data identified by a <router-link to="#what_is_a_cid">CID</router-link>.
    </p>

    <h3 id="what_is_a_doi" class="link-target">What is a DOI?</h3>
    <p>
    A <a href="https://www.doi.org/the-identifier/what-is-a-doi/" target="_blank" rel="noopener">DOI</a> is a digital identifier of an object, any object — physical, digital, or abstract.
    </p>
</template>
