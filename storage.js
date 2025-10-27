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
        return JSON.parse(savedData);
    } else {
      // If no data, create a brand new empty structure
        console.log("No saved data found. Creating new data structure.");
        let newData = [];
        for (let i = 0; i < 52; i++) {
        // Each week is an object with an empty memory
        newData.push({
            memory: ""
        });
        }
        return newData;
    }
}