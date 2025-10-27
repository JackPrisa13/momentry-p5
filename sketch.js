// --- Global Variables ---

// This array will hold the 52 WeekCircle objects
let weeks = [];
// This array will hold the 52 data objects (e.g., { memory: "..." })
let yearData = [];

// Audio for hover sounds
let osc, env;
let lastTickTime = 0;
const TICK_GAP_MS = 80; // Small cooldown between sounds

// Background music
let bgMusic;
let musicPlaying = false;
let musicVolume = 0.3; // 30% volume
let musicStarted = false;

let currentWeekIndex;

// --- Grid Layout Parameters ---
const numRows = 7;
const circleSize = 100;
const xSpacing = circleSize + 30;
// Use a tighter vertical spacing for the honeycomb look
const ySpacing = circleSize + 0; 
const backgroundColour = "#F7F6E4";

/**
 * p5.js preload()
 * Runs before setup(). Use it to load assets.
 */
function preload() {
  // Load background music
  bgMusic = loadSound('bg_music.mp3');
}

/**
 * getISOWeekNumber()
 * Calculates the ISO week number for a given date.
 * ISO weeks start on Monday and the first week of the year
 * is the week that contains the first Thursday.
 * @param {Date} date - The date to calculate the week number for
 * @returns {number} - The ISO week number (1-53)
 */
function getISOWeekNumber(date) {
  // Create a new date object to avoid modifying the original
  let d = new Date(date.getTime());
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  let dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  
  // Get first day of year
  let yearStart = new Date(d.getFullYear(), 0, 1);
  
  // Calculate full weeks to nearest Thursday
  let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  return weekNo;
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // --- Audio Setup ---
  osc = new p5.Oscillator("sine");
  osc.freq(200);
  osc.amp(0);
  osc.start();

  env = new p5.Envelope(0.001, 0.25, 0.04, 0.0);

  // --- Background Music Setup ---
  // Create ambient background music using multiple oscillators
  setupBackgroundMusic();

  // --- Calculate Current Week (ISO Standard) ---
  let now = new Date();
  let isoWeekNumber = getISOWeekNumber(now);
  currentWeekIndex = isoWeekNumber - 1; // Convert to 0-based index
  
  // Debug: Log current week information
  console.log("Current date:", now.toDateString());
  console.log("ISO Week number:", isoWeekNumber);
  console.log("Current week index (0-based):", currentWeekIndex);

  // Load our data. Either from storage or create a new empty array.
  yearData = loadData();

  // --- Build the 52-Circle Honeycomb Grid ---
  let weekID = 0;
  
  // Calculate the total grid dimensions to center it
  let gridWidth = 8 * xSpacing;
  let gridHeight = 7 * ySpacing;
  let startX = (width - gridWidth) / 2 + (xSpacing / 2);
  let startY = (height - gridHeight) / 2;

  // Loop through 7 rows
  for (let r = 0; r < numRows; r++) {
    // Calculate the 'y' position for this row
    let y = startY + r * ySpacing;

    // Is this an even row (0, 2, 4, 6) or odd row (1, 3, 5)?
    let isEvenRow = (r % 2 === 0);
    let numCols = isEvenRow ? 7 : 8;
    
    // Get the horizontal offset
    // Odd rows (8 circles) are flush left
    // Even rows (7 circles) are indented by half a circle
    let xOffset = isEvenRow ? xSpacing / 2 : 0;

    // Now loop through the columns for this row
    for (let c = 0; c < numCols; c++) {
      let x = startX + xOffset + c * xSpacing;

      // Get the specific data for this week
      let dataForThisWeek = yearData[weekID];

      // Create the new WeekCircle object
      let newWeek = new WeekCircle(x, y, circleSize, weekID, dataForThisWeek);

      // Add it to our array of objects
      weeks.push(newWeek);

      // IMPORTANT: Increment the ID for the next week
      weekID++;
    }
  }
}

/**
 * p5.js draw()
 * Runs 60 times per second.
 */
function draw() {
  // Set background to the dark grey from your sketch
  background(backgroundColour); 

  let anyHoveredThisFrame = false;

  // This loop updates hover states and checks if *any* circle is hovered
  for (let week of weeks) {
    if (week.checkHover()) {
      anyHoveredThisFrame = true;
    }
  }

  // First, draw all non-hovered circles
  for (let week of weeks) {
    if (!week.isHovered) {
      week.display(currentWeekIndex);
    }
  }
  
  // Then, draw all hovered circles on top
  for (let week of weeks) {
    if (week.isHovered) {
      week.display(currentWeekIndex);
    }
  }

  // --- Sound Logic ---
  // This ensures the sound only plays *once* when you first hover
  // over a circle, not 60 times per second.
  if (anyHoveredThisFrame && !isCurrentlyHovering) {
    // if (hoverSound) {
    //   hoverSound.play();
    // }
  }
  isCurrentlyHovering = anyHoveredThisFrame;
}

/**
 * p5.js mousePressed()
 * Runs once every time the mouse is clicked.
 */
function mousePressed() {
  // Unlock audio on first user interaction
  userStartAudio();
  
  // Start background music on first interaction
  startBackgroundMusic();
  
  // Check which circle was clicked
  for (let week of weeks) {
    
    // The checkHover() method set week.isHovered to true
    if (week.isHovered) {

      let promptMessage;
      if (week.id > currentWeekIndex) {
        promptMessage = "Enter your GOAL for Week " + (week.id + 1) + ":";
      } else {
        promptMessage = "Enter your Memory for Week " + (week.id + 1) + ":";
      }
      
      let newEntry = prompt(promptMessage, week.data.memory);

      // Check if the user clicked "Cancel"
      if (newEntry !== null) {
        // Update the data in our main data array
        yearData[week.id].memory = newEntry;

        // Save the *entire* yearData array to local storage
        saveData(yearData);
      }
      
      // Stop looping, we only want to click one circle
      break; 
    }
  }
}

function keyPressed() {
  if (key === 'm') {
    toggleBackgroundMusic();
  }
}

/**
 * playTick()
 * Plays a hover sound with debouncing
 */
function playTick() {
  const now = millis();
  if (now - lastTickTime < TICK_GAP_MS) return; // Debounce
  if (env && osc) env.play(osc);
  lastTickTime = now;
}

/**
 * setupBackgroundMusic()
 * Sets up the loaded background music file
 */
function setupBackgroundMusic() {
  if (bgMusic) {
    // Set volume and loop settings
    bgMusic.setVolume(musicVolume);
    bgMusic.loop(); // Loop the music
    bgMusic.stop(); // Start stopped, will be played on first interaction
  }
}

/**
 * startBackgroundMusic()
 * Starts the background music with fade-in
 */
function startBackgroundMusic() {
  if (!musicStarted && bgMusic) {
    musicStarted = true;
    musicPlaying = true;
    
    // Start playing the music
    bgMusic.play();
  }
}

/**
 * toggleBackgroundMusic()
 * Toggles background music on/off
 */
function toggleBackgroundMusic() {
  if (bgMusic) {
    if (musicPlaying) {
      // Stop the music
      bgMusic.stop();
      musicPlaying = false;
    } else {
      // Start the music
      bgMusic.play();
      musicPlaying = true;
    }
  }
}