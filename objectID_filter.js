const fs = require('fs');
const fetch = require('node-fetch'); // If you're using Node < 18, run: npm install node-fetch
const cliProgress = require('cli-progress'); // To show pregress bar; similar to tqdm in Python


const base_url = 'https://collectionapi.metmuseum.org/public/collection/v1'; // Base URL for MET API


async function fetchAllObjectIDs() {// Fetch all object IDs
    const response = await fetch(`${base_url}/objects`);
    if (!response.ok) throw new Error(`Failed to fetch object list: ${response.status}`);
    const data = await response.json();
    return data.objectIDs;
}


async function fetchObjectMetadata(id) {// Fetch metadata for 1 object
    try {
        const response = await fetch(`${base_url}/objects/${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
    } catch (e) {
        console.warn(`Error fetching object ${id}:`, e.message);
        return null;
    }
}


function filterHasPrimaryImageSmall(metadata) { // Filter: has a small primary image
    return metadata && metadata.primaryImageSmall && metadata.primaryImageSmall.trim() !== '';
}


function saveToJSON(data, filename = 'output/met_objects_with_images.json') { // Save result to JSON
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    // console.log(`💾 Saved ${data.length} entries to ${filename}`);
}


function wait(ms) { // Wait helper
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function fetchBatchWithImages(ids) {// Fetch a batch of objects and return only those with images
    const promises = ids.map(fetchObjectMetadata);
    const results = await Promise.allSettled(promises);

    const validObjects = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const metadata = result.value;

            if (filterHasPrimaryImageSmall(metadata)) {
                validObjects.push(metadata.objectID);


                // Comment out all the parameters below to reduce file size. Since it only saves the objectID, saving it as a list can save more file space

                // title: metadata.title,
                // culture: metadata.culture,
                // image: metadata.primaryImageSmall,
                //
                // artistName: metadata.artistDisplayName,
                // artistNationality: metadata.artistNationality,
                // artistDateBegin: metadata.artistBeginDate,
                // artistDateEnd: metadata.artistEndDate,
                //
                // // Details about the object dates are provided below so you can use to make more precise filtering etc
                // objectDateBegin: metadata.objectBeginDate,
                // objectDateEnd: metadata.objectEndDate,
                //
                // objectMedium: metadata.medium,
                // objectDepartment: metadata.objectDepartment, //Section/department the object belongs to
                //
                // objectURLMET: metadata.objectURL,
                // objectURLWiki: metadata.objectWikidata_URL,

            }
        }
    }

    return validObjects;
}

// Main loop
async function main() {
    try {
        const allIds = await fetchAllObjectIDs();
        console.log(`📦 Total object IDs: ${allIds.length}`);

        const results = [];
        const batchSize = 75; // MET API limits the speed to 80 calls per second, so you need to provide a number that's smaller than 80

        const totalBatches = Math.ceil(allIds.length / batchSize);
        const totalSeconds = totalBatches; // one batch per second
        const totalMinutes = totalSeconds / 60;
        const totalHours = totalMinutes / 60;

        console.log(`⏱ Estimated time: ~${totalMinutes.toFixed(1)} minutes (~${totalHours.toFixed(2)} hours)`);

        // Create and start progress bar
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(allIds.length, 0);

        for (let i = 0; i < allIds.length; i += batchSize) {
            const batch = allIds.slice(i, i + batchSize);
            const found = await fetchBatchWithImages(batch);
            results.push(...found);
            saveToJSON(results);

            // Update the progress bar
            bar.increment(batch.length);

            await wait(1000); // 1-second throttle
        }

        bar.stop(); // Finish the bar

        console.log('🏁 Done! Final result saved.');

    } catch (e) {
        console.error('❌ Main error:', e);
    }
}


main();
