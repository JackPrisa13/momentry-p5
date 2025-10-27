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

// Birth date and age calculation
let birthDate = null;
let userAge = 0;
let weeksLived = 0;
let showStartingPage = true;
let startingPage;

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

/**
 * calculateAgeAndWeeks()
 * Calculates user's age and total weeks lived
 */
function calculateAgeAndWeeks() {
  if (birthDate) {
    let now = new Date();
    let diffTime = now.getTime() - birthDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate age in years
    userAge = Math.floor(diffDays / 365.25);
    
    // Calculate total weeks lived
    weeksLived = Math.floor(diffDays / 7);
  }
}

/**
 * getWeeksSinceBirth()
 * Calculates how many weeks have passed since birth for a given week
 * @param {number} weekIndex - The week index (0-51)
 * @returns {number} - Weeks since birth
 */
function getWeeksSinceBirth(weekIndex) {
  if (!birthDate) return weekIndex + 1;
  
  let now = new Date();
  let currentYear = now.getFullYear();
  let weekStartDate = getDateFromWeekIndex(weekIndex, currentYear);
  
  let diffTime = weekStartDate.getTime() - birthDate.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let weeksSinceBirth = Math.floor(diffDays / 7);
  
  // Ensure we don't return negative values for future weeks
  return Math.max(0, weeksSinceBirth);
}

/**
 * getDateFromWeekIndex()
 * Gets the date for a given week index in a given year
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year
 * @returns {Date} - The date of that week
 */
function getDateFromWeekIndex(weekIndex, year) {
  // Get the first day of the year
  let jan1 = new Date(year, 0, 1);
  
  // Find the first Thursday of the year (ISO week 1)
  let firstThursday = new Date(jan1);
  let dayOfWeek = jan1.getDay();
  let daysToThursday = (4 - dayOfWeek + 7) % 7;
  firstThursday.setDate(jan1.getDate() + daysToThursday);
  
  // Calculate the date for the given week
  let weekDate = new Date(firstThursday);
  weekDate.setDate(firstThursday.getDate() + (weekIndex * 7));
  
  return weekDate;
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize starting page
  startingPage = new StartingPage();

  // TODO: Check if birth date exists
  if (StartingPage.checkIfBirthDateExists()) {
    birthDate = StartingPage.getSavedBirthDate();
    calculateAgeAndWeeks();
    showStartingPage = false;
    initializeMainApp();
  }

  // Always show starting page (don't check for saved birth date) For testing purposes 
  // showStartingPage = true;

  // --- Audio Setup ---
  osc = new p5.Oscillator("sine");
  osc.freq(200);
  osc.amp(0);
  osc.start();

  env = new p5.Envelope(0.001, 0.25, 0.04, 0.0);

  // --- Background Music Setup ---
  // Create ambient background music using multiple oscillators
  setupBackgroundMusic();
  startBackgroundMusic();
}

/**
 * p5.js draw()
 * Runs 60 times per second.
 */
function draw() {
  // Set background to the dark grey from your sketch
  background(backgroundColour); 

  if (showStartingPage) {
    startingPage.display();
    return;
  }

  // Draw header with age info
  drawHeader();

  let anyHoveredThisFrame = false;

  // This loop updates hover states and checks if *any* circle is hovered
  for (let week of weeks) {
    if (week.checkHover()) {
      anyHoveredThisFrame = true;
    }
  }

  // First, draw all non-hovered circles
  for (let week of weeks) {
    week.display(currentWeekIndex);
  }
}

/**
 * p5.js mousePressed()
 * Runs once every time the mouse is clicked.
 */
function mousePressed() {


  if (showStartingPage) {
    if (startingPage.handleClick()) {
      birthDate = StartingPage.getSavedBirthDate();
      calculateAgeAndWeeks();
      showStartingPage = false;
      // Clear any existing weeks array before initializing
      weeks = [];
      initializeMainApp();
    }
    return;
  }

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

function initializeMainApp() {
  // Initialize the main app
  let now = new Date();
  let isoWeekNumber = getISOWeekNumber(now);
  currentWeekIndex = isoWeekNumber - 1; // Convert to 0-based index

  console.log("Current date:", now.toDateString());
  console.log("ISO Week number:", isoWeekNumber);
  console.log("Current week index (0-based):", currentWeekIndex);

  yearData = loadData();

  let weekID = 0;
  
  // Calculate the total grid dimensions to center it
  let gridWidth = 8 * xSpacing;
  let gridHeight = 7 * ySpacing;
  let startX = (width - gridWidth) / 2 + (xSpacing / 2);
  let startY = (height - gridHeight) / 2 + 80; // Offset for header

  // Loop through 7 rows
  for (let r = 0; r < numRows; r++) {
    let y = startY + r * ySpacing;
    let isEvenRow = (r % 2 === 0);
    let numCols = isEvenRow ? 7 : 8;
    let xOffset = isEvenRow ? xSpacing / 2 : 0;

    for (let c = 0; c < numCols; c++) {
      let x = startX + xOffset + c * xSpacing;
      let dataForThisWeek = yearData[weekID];
      let weeksSinceBirth = getWeeksSinceBirth(weekID);
      let newWeek = new WeekCircle(x, y, circleSize, weekID, weeksSinceBirth, dataForThisWeek);
      weeks.push(newWeek);
      weekID++;
    }
  }
}

/**
 * drawHeader()
 * Draws the header showing age and weeks lived
 */
function drawHeader() {
  if (birthDate) {
    push();
    noStroke();
    textAlign(CENTER, TOP);
    fill("#525349");
    textSize(24);
    textStyle(ITALIC);
    text(`You are ${userAge} years old, which means you have lived for ${weeksLived.toLocaleString()} weeks`, 
          width / 2, 60);
    pop();
  }
}