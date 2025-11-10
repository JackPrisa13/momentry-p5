/**
 * saveData()
 * Saves the entire yearData array to the browser's local storage.
 * @param {object[]} data - The array of 52 week-data objects.
 */
function saveData(data) {
    // Convert the array to a JSON string and store it
    localStorage.setItem('momentryData', JSON.stringify(data));
    console.log("Data saved!");
}

/**
 * migrateOldDataFormat()
 * Migrates old data format (single memory string) to new format (memories array)
 * @param {object[]} data - The old data format
 * @returns {object[]} - The new data format
 */
function migrateOldDataFormat(data) {
    let migratedData = [];
    for (let i = 0; i < data.length; i++) {
        let week = data[i];
        
        // Check if it's old format (has 'memory' property as string)
        if (week.memory !== undefined && typeof week.memory === 'string') {
            // Migrate: convert single memory string to memories array
            migratedData.push({
                memories: week.memory ? [{
                    id: generateMemoryId(),
                    text: week.memory,
                    date: new Date().toISOString().split('T')[0], // Today's date as default
                    timestamp: new Date().toISOString()
                }] : []
            });
        } else if (week.memories !== undefined) {
            // Already in new format, but ensure all memories have required fields
            let migratedMemories = week.memories.map(mem => {
                return {
                    id: mem.id || generateMemoryId(),
                    text: mem.text || '',
                    date: mem.date || new Date().toISOString().split('T')[0],
                    timestamp: mem.timestamp || new Date().toISOString()
                };
            });
            migratedData.push({ memories: migratedMemories });
        } else {
            // Empty week
            migratedData.push({ memories: [] });
        }
    }
    return migratedData;
}

/**
 * generateMemoryId()
 * Generates a unique ID for a memory
 * @returns {string} - Unique memory ID
 */
function generateMemoryId() {
    return 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * loadData()
 * Loads the data from local storage. If no data is found,
 * it creates a new, empty array for 52 weeks.
 * @returns {object[]} - The array of 52 week-data objects.
 */
function loadData() {
    let savedData = localStorage.getItem('momentryData');

    if (savedData) {
        // If we found data, parse it and return it
        console.log("Data loaded from storage.");
        let parsedData = JSON.parse(savedData);
        
        // Check if migration is needed (old format detection)
        if (parsedData.length > 0 && parsedData[0].memory !== undefined && typeof parsedData[0].memory === 'string') {
            console.log("Migrating old data format to new format...");
            parsedData = migrateOldDataFormat(parsedData);
            // Save migrated data
            saveData(parsedData);
        }
        
        return parsedData;
    } else {
        // If no data, create a brand new empty structure
        console.log("No saved data found. Creating new data structure.");
        let newData = [];
        for (let i = 0; i < 52; i++) {
            // Each week is an object with an empty memories array
            newData.push({
                memories: []
            });
        }
        return newData;
    }
}