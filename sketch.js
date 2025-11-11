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

// Year navigation
let currentDisplayYear; // The year currently being displayed

// Birth date and age calculation
let birthDate = null;
let userAge = 0;
let weeksLived = 0;
let showStartingPage = true;
let startingPage;

// Modal state
let selectedWeeksSinceBirth = null; // Weeks since birth for the selected week (universal identifier)
let editingMemoryId = null; // ID of memory being edited, null if adding new

// Mouse trail
let mouseTrail;

// Goal countdown
let goalCountdown;

// --- Grid Layout Parameters ---
const numRows = 7;
let circleSize = 100; // Made variable for responsive design
let xSpacing = circleSize + 30;
// Use a tighter vertical spacing for the honeycomb look
let ySpacing = circleSize + 0; 
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
 * calculateAgeAndWeeks()
 * Wrapper function that updates global variables from DateUtils
 * Note: DateUtils.calculateAgeAndWeeks takes birthDate as parameter
 */
function calculateAgeAndWeeks() {
  if (birthDate) {
    // Call DateUtils function directly (it's in global scope from DateUtils.js)
    // We need to use the function before we shadow it, so we'll call it inline
    let now = new Date();
    let diffTime = now.getTime() - birthDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    userAge = Math.floor(diffDays / 365.25);
    weeksLived = Math.floor(diffDays / 7);
  }
}

/**
 * getWeeksSinceBirth()
 * Wrapper that uses DateUtils function with global birthDate
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year to calculate for (defaults to currentDisplayYear)
 */
function getWeeksSinceBirth(weekIndex, year) {
  if (!birthDate) return weekIndex + 1;
  
  // Use provided year or currentDisplayYear, or fallback to current year
  if (year === undefined) {
    year = currentDisplayYear || new Date().getFullYear();
  }
  
  let weekStartDate = getDateFromWeekIndex(weekIndex, year);
  
  let diffTime = weekStartDate.getTime() - birthDate.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let weeksSinceBirth = Math.floor(diffDays / 7);
  
  return Math.max(0, weeksSinceBirth);
}

/**
 * calculateResponsiveSizes()
 * Calculates responsive circle size and spacing based on window dimensions
 */
function calculateResponsiveSizes() {
  // Base sizes for different screen widths
  if (windowWidth < 600) {
    // Mobile: smaller circles
    circleSize = 40;
    xSpacing = circleSize + 15;
    ySpacing = circleSize + 0;
  } else if (windowWidth < 900) {
    // Tablet: medium circles
    circleSize = 60;
    xSpacing = circleSize + 20;
    ySpacing = circleSize + 0;
  } else if (windowWidth < 1200) {
    // Small desktop: slightly smaller
    circleSize = 80;
    xSpacing = circleSize + 25;
    ySpacing = circleSize + 0;
  } else {
    // Large desktop: full size
    circleSize = 100;
    xSpacing = circleSize + 30;
    ySpacing = circleSize + 0;
  }
}

function setup() {
  console.log('Setup called');
  createCanvas(windowWidth, windowHeight);
  console.log('Canvas created');

  // Calculate responsive sizes (after canvas is created)
  calculateResponsiveSizes();

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
  
  // --- Modal Event Listeners ---
  setupModalListeners();
  
  // --- Music Toggle Button Setup ---
  let musicToggleBtn = document.getElementById('music-toggle-btn');
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', function() {
      toggleBackgroundMusic();
    });
    // Initialize icon state
    updateMusicIcon();
  }
  
  // --- Home Button Setup ---
  let homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', function() {
      returnToHome();
    });
  }
  
  // --- Year Navigation Buttons Setup ---
  let yearPrevBtn = document.getElementById('year-prev-btn');
  if (yearPrevBtn) {
    yearPrevBtn.addEventListener('click', function() {
      navigateToYear(currentDisplayYear - 1);
    });
  }
  
  let yearNextBtn = document.getElementById('year-next-btn');
  if (yearNextBtn) {
    yearNextBtn.addEventListener('click', function() {
      navigateToYear(currentDisplayYear + 1);
    });
  }
  
  // Initialize mouse trail
  mouseTrail = new MouseTrail();
  mouseTrail.initialize();
  
  // Initialize goal countdown
  goalCountdown = new GoalCountdown();
}

// Modal and memory management functions are now in ModalManager.js

/**
 * p5.js draw()
 * Runs 60 times per second.
 */
function draw() {
  // Set background to the dark grey from your sketch
  background(backgroundColour);
  
  // Update mouse trail
  if (mouseTrail) {
    mouseTrail.update(showStartingPage);
  }

  if (showStartingPage) {
    startingPage.display();
    // Draw mouse trail on top (even on starting page, but it will be cleared by update)
    if (mouseTrail) {
      mouseTrail.display(showStartingPage);
    }
    // Hide home button and navigation buttons on starting page
    let homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      homeBtn.style.display = 'none';
    }
    // Ensure navigation buttons are hidden on starting page
    updateNavigationButtons();
    return;
  }
  
  // Show home button when not on starting page
  let homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.style.display = 'flex';
  }
  
  // Update navigation buttons visibility
  updateNavigationButtons();

  // Draw header with age info
  drawHeader();

  // Check if modal is open
  let modalOpen = isModalOpen();

  let anyHoveredThisFrame = false;

  // Only check hover states if modal is NOT open
  if (!modalOpen) {
  // This loop updates hover states and checks if *any* circle is hovered
  for (let week of weeks) {
    if (week.checkHover()) {
      anyHoveredThisFrame = true;
      }
    }
  } else {
    // If modal is open, clear all hover states to prevent hover effects
    for (let week of weeks) {
      week.isHovered = false;
    }
  }

  // Draw all circles
  for (let week of weeks) {
    week.display(currentWeekIndex, currentDisplayYear, birthDate);
  }

  // Draw mouse trail on top of everything
  if (mouseTrail) {
    mouseTrail.display(showStartingPage);
  }
  
  // Update and display goal countdown (only when not on starting page)
  if (!showStartingPage && goalCountdown && birthDate) {
    goalCountdown.update(birthDate, currentDisplayYear, currentWeekIndex);
    goalCountdown.display();
  }
}

/**
 * isModalOpen()
 * Checks if the modal is currently open
 * @returns {boolean} - True if modal is open
 */
function isModalOpen() {
  let modal = document.getElementById('entry-modal');
  return modal && modal.classList.contains('show');
}

/**
 * isButtonClick()
 * Checks if the click is on a button element
 * @returns {boolean} - True if click is on a button
 */
function isButtonClick() {
  let canvas = document.querySelector('canvas');
  if (!canvas) return false;
  
  let rect = canvas.getBoundingClientRect();
  let screenX = rect.left + mouseX;
  let screenY = rect.top + mouseY;
  let elementAtPoint = document.elementFromPoint(screenX, screenY);
  
  return elementAtPoint && (elementAtPoint.tagName === 'BUTTON' || elementAtPoint.closest('button'));
}

/**
 * handleStartingPageClick()
 * Handles clicks on the starting page
 */
function handleStartingPageClick() {
  if (startingPage.handleClick()) {
    birthDate = StartingPage.getSavedBirthDate();
    calculateAgeAndWeeks();
    showStartingPage = false;
    weeks = [];
    initializeMainApp();
  }
}

/**
 * isClickOnCircle()
 * Checks if the mouse click is on a specific circle
 * @param {WeekCircle} week - The week circle to check
 * @returns {boolean} - True if click is on the circle
 */
function isClickOnCircle(week) {
  let d = dist(mouseX, mouseY, week.x, week.y);
  return d < week.baseSize / 2;
}

function mousePressed() {
  // Don't process clicks if modal is open
  if (isModalOpen()) return;
  
  // Don't process clicks if clicking on a button
  if (isButtonClick()) return;

  // Handle starting page clicks
  if (showStartingPage) {
    handleStartingPageClick();
    return;
  }

  // Unlock audio on first user interaction
  userStartAudio();
  startBackgroundMusic();
  
  // Check which circle was clicked
  for (let week of weeks) {
    if (week.isBeforeBirth) continue;
    
    if (isClickOnCircle(week)) {
      showWeekModal(week);
      break;
    }
  }
}

/**
 * showWeekModal()
 * Sets up and displays the modal for a clicked week circle
 * @param {WeekCircle} week - The week circle that was clicked
 */
function showWeekModal(week) {
  console.log('Week circle clicked:', week.id, 'Weeks since birth:', week.weeksSinceBirth);
  
  // Store weeks since birth as the universal identifier
  selectedWeeksSinceBirth = week.weeksSinceBirth;
  
  // Get modal elements
  let modal = document.getElementById('entry-modal');
  let modalTitle = document.getElementById('modal-title');
  let textInput = document.getElementById('modal-text-input');
  
  // Check if elements exist
  if (!modal || !modalTitle || !textInput) {
    console.error('Modal elements not found!');
    return;
  }
  
  // Get the year and week index for this weeks since birth
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(week.weeksSinceBirth, birthDate);
  if (!yearWeekInfo) {
    console.error('Could not determine year and week index for weeks since birth:', week.weeksSinceBirth);
    return;
  }
  
  // Set modal title based on week type
  let now = new Date();
  let currentYear = now.getFullYear();
  let isFutureWeek = (yearWeekInfo.year > currentYear) || 
                     (yearWeekInfo.year === currentYear && yearWeekInfo.weekIndex > currentWeekIndex);
  
  // Display week number within the year (1-52)
  modalTitle.textContent = isFutureWeek 
    ? `Week ${yearWeekInfo.weekIndex + 1} - Goals`
    : `Week ${yearWeekInfo.weekIndex + 1} - Memories`;
  
  // Reset editing state (we're adding new, not editing)
  editingMemoryId = null;
  
  // Update save button text
  let saveBtn = document.getElementById('modal-save-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Add';
  }
  
  // Setup date input
  setupDateInput(yearWeekInfo);
  
  // Display existing memories list (using weeks since birth)
  displayMemoriesList(week.weeksSinceBirth);
  
  // Clear all hover states before showing modal
  clearAllHoverStates();
  
  // Show the modal
  showModal(modal, textInput);
}

/**
 * setupDateInput()
 * Sets up the date input field with min/max and default value
 * @param {Object} yearWeekInfo - Object with year and weekIndex
 */
function setupDateInput(yearWeekInfo) {
  let dateInput = document.getElementById('memory-date-input');
  if (!dateInput) return;
  
  // Get the week's date range (Monday to Sunday) for the correct year
  let weekRange = getWeekDateRange(yearWeekInfo.weekIndex, yearWeekInfo.year);
  
  // Format dates as YYYY-MM-DD for input min/max (using local timezone)
  let minDate = formatDateForInput(weekRange.startDate);
  let maxDate = formatDateForInput(weekRange.endDate);
  
  // Set min and max to limit date selection to the week
  dateInput.setAttribute('min', minDate);
  dateInput.setAttribute('max', maxDate);
  
  // Set default date to Monday of the week (or today if within the week)
  let today = new Date();
  let defaultDate = weekRange.startDate;
  if (today >= weekRange.startDate && today <= weekRange.endDate) {
    defaultDate = today;
  }
  dateInput.value = formatDateForInput(defaultDate);
}

/**
 * clearAllHoverStates()
 * Clears hover states for all week circles
 */
function clearAllHoverStates() {
  for (let w of weeks) {
    w.isHovered = false;
  }
}

/**
 * showModal()
 * Displays the modal and disables canvas interaction
 * @param {HTMLElement} modal - The modal element
 * @param {HTMLElement} textInput - The text input element to focus
 */
function showModal(modal, textInput) {
  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Disable canvas interaction
  let canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.pointerEvents = 'none';
  }
  
  // Focus on textarea
  textInput.focus();
}

// Keyboard shortcuts removed - use the music toggle button instead

// Audio functions are now in AudioManager.js

/**
 * returnToHome()
 * Resets the app and returns to the starting page where user can enter/edit their birth date
 */
function returnToHome() {
  // Hide modal if it's open
  let modal = document.getElementById('entry-modal');
  if (modal && modal.classList.contains('show')) {
    hideModal();
  }
  
  // Clear the weeks array
  weeks = [];
  
  // Reset state variables
  birthDate = null;
  userAge = 0;
  weeksLived = 0;
  showStartingPage = true;
  
  // Clear the saved birth date from localStorage so user can enter a new one
  localStorage.removeItem('userBirthDate');
  
  // Re-initialize the starting page
  startingPage = new StartingPage();
}

/**
 * refreshCircleData()
 * Refreshes the data for all circles after memory changes
 * @param {number} year - The year to refresh data for
 */
function refreshCircleData(year) {
  // Only refresh if we're viewing the same year
  if (year !== currentDisplayYear) {
    return;
  }
  
  // Reload the year data
  yearData = loadData(year);
  
  // Update each circle's data reference and recalculate state
  let today = new Date();
  for (let week of weeks) {
    if (week.id >= 0 && week.id < yearData.length) {
      week.data = yearData[week.id];
      // Recalculate state in case data changed
      week.updateState(currentDisplayYear, birthDate, today);
    }
  }
}

/**
 * navigateToYear()
 * Navigates to a different year and rebuilds the grid
 * @param {number} year - The year to navigate to
 */
function navigateToYear(year) {
  if (!birthDate) return; // Can't navigate without birth date
  
  // Get birth year to prevent navigating before birth
  let birthYear = birthDate.getFullYear();
  
  // Prevent navigating to years before birth year
  if (year < birthYear) {
    console.log(`Cannot navigate to year ${year} - before birth year ${birthYear}`);
    return;
  }
  
  // Hide modal if it's open
  let modal = document.getElementById('entry-modal');
  if (modal && modal.classList.contains('show')) {
    hideModal();
  }
  
  // Clear modal state to prevent using stale week identifier
  selectedWeeksSinceBirth = null;
  editingMemoryId = null;
  
  // Clear existing weeks
  weeks = [];
  
  // Rebuild for the new year
  initializeMainApp(year);
}

/**
 * updateNavigationButtons()
 * Updates the visibility and state of navigation buttons
 */
function updateNavigationButtons() {
  let prevBtn = document.getElementById('year-prev-btn');
  let nextBtn = document.getElementById('year-next-btn');
  
  if (!prevBtn || !nextBtn || !currentDisplayYear) return;
  
  // Show buttons only when not on starting page
  if (showStartingPage) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }
  
  // Show buttons
  prevBtn.style.display = 'flex';
  nextBtn.style.display = 'flex';
  
  // Disable previous button if at or before birth year
  if (birthDate) {
    let birthYear = birthDate.getFullYear();
    if (currentDisplayYear <= birthYear) {
      // Disable previous button - can't go before birth year
      prevBtn.disabled = true;
    } else {
      // Enable previous button
      prevBtn.disabled = false;
    }
  }
  
  // Next button is always enabled (no limit on future years)
  nextBtn.disabled = false;
}

function initializeMainApp(year) {
  // Initialize the main app
  // If no year specified, use current year
  if (year === undefined) {
    year = new Date().getFullYear();
  }
  
  // Ensure we don't start before birth year
  if (birthDate) {
    let birthYear = birthDate.getFullYear();
    if (year < birthYear) {
      console.log(`Cannot initialize to year ${year} - before birth year ${birthYear}. Using birth year instead.`);
      year = birthYear;
    }
  }
  
  currentDisplayYear = year;
  
  let now = new Date();
  let isoWeekInfo = getISOWeekNumber(now);
  currentWeekIndex = isoWeekInfo.weekNumber - 1; // Convert to 0-based index
  
  // Only highlight current week if viewing the ISO year (which handles year boundaries correctly)
  if (year !== isoWeekInfo.year) {
    currentWeekIndex = -1; // No current week highlight for past/future years
  }

  console.log("Displaying year:", year);
  console.log("Current date:", now.toDateString());
  console.log("ISO Week number:", isoWeekInfo.weekNumber, "ISO Year:", isoWeekInfo.year);
  console.log("Current week index (0-based):", currentWeekIndex);

  yearData = loadData(year);

  let weekID = 0;
  
  // Calculate the total grid dimensions to center it
  let gridWidth = 8 * xSpacing;
  let gridHeight = 7 * ySpacing;
  let startX = (width - gridWidth) / 2 + (xSpacing / 2);
  
  // Responsive header offset
  let headerOffset = windowWidth < 600 ? 50 : windowWidth < 900 ? 70 : 80;
  let startY = (height - gridHeight) / 2 + headerOffset; // Offset for header

  // Loop through 7 and 8rows
  for (let r = 0; r < numRows; r++) {
    let y = startY + r * ySpacing;
    let isEvenRow = (r % 2 === 0);
    let numCols = isEvenRow ? 7 : 8;
    let xOffset = isEvenRow ? xSpacing / 2 : 0;

    for (let c = 0; c < numCols; c++) {
      let x = startX + xOffset + c * xSpacing;
      let dataForThisWeek = yearData[weekID];
      let weeksSinceBirth = getWeeksSinceBirth(weekID, year);
      let newWeek = new WeekCircle(x, y, circleSize, weekID, weeksSinceBirth, dataForThisWeek);
      
      // Calculate and cache state once when circle is created
      let today = new Date();
      newWeek.updateState(year, birthDate, today);
      
      weeks.push(newWeek);
      weekID++;
    }
  }
  
  // Update navigation button visibility
  updateNavigationButtons();
}

/**
 * windowResized()
 * Called automatically when the window is resized
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Recalculate responsive sizes
  calculateResponsiveSizes();
  
  // Rebuild the grid if the app is initialized
  if (!showStartingPage && weeks.length > 0) {
    weeks = [];
    initializeMainApp(currentDisplayYear);
  }
}

/**
 * drawHeader()
 * Draws the header showing age and weeks lived, and current year
 */
function drawHeader() {
  if (birthDate) {
    push();
    noStroke();
    textAlign(CENTER, TOP);
    fill("#525349");
    
    // Responsive text size
    let headerTextSize = windowWidth < 600 ? 16 : windowWidth < 900 ? 20 : 24;
    let yearTextSize = windowWidth < 600 ? 14 : windowWidth < 900 ? 18 : 22;
    textSize(headerTextSize);
    textStyle(ITALIC);
    
    // Responsive top margin
    let topMargin = windowWidth < 600 ? 20 : windowWidth < 900 ? 40 : 60;
    let yearMargin = topMargin + (windowWidth < 600 ? 25 : windowWidth < 900 ? 30 : 35);
    
    text(`You are ${userAge} years old. You have lived for ${weeksLived.toLocaleString()} weeks`, 
          width / 2, topMargin);
    
    // Show current year being displayed
    if (currentDisplayYear) {
      textSize(yearTextSize);
      let currentYear = new Date().getFullYear();
      let yearText = currentDisplayYear === currentYear 
        ? `Viewing ${currentDisplayYear}` 
        : `Viewing ${currentDisplayYear}`;
      text(yearText, width / 2, yearMargin);
    }
    
    pop();
  }
}