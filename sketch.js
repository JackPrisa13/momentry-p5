/**
 * App Class
 * Encapsulates all application state and logic
 * Note: p5.js requires setup() and draw() to be global functions,
 * so they delegate to this App instance
 */
class App {
  constructor() {
    // Week circles and data
    this.weeks = [];
    this.yearData = [];
    
    // Audio for hover sounds
    this.osc = null;
    this.env = null;
    this.lastTickTime = 0;
    this.TICK_GAP_MS = 80; // Small cooldown between sounds
    
    // Background music
    this.bgMusic = null;
    this.musicPlaying = false;
    this.musicVolume = 0.1; // 10% volume
    this.musicStarted = false;
    
    // Week and year navigation
    this.currentWeekIndex = null;
    this.currentDisplayYear = null;
    
    // Birth date and age calculation
    this.birthDate = null;
    this.userAge = 0;
    this.weeksLived = 0;
    this.showStartingPage = true;
    this.startingPage = null;
    
    // Mouse trail and goal countdown
    this.mouseTrail = null;
    this.goalCountdown = null;
    
    // Grid Layout Parameters
    this.numRows = 7;
    this.circleSize = 100; // Made variable for responsive design
    this.xSpacing = this.circleSize + 30;
    this.ySpacing = this.circleSize; // Use a tighter vertical spacing for the honeycomb look
    this.backgroundColour = "#F7F6E4";
    
    // Year transition state
    this.yearTransition = {
      active: false,
      alpha: 0,
      duration: 300, // milliseconds for each fade (out + in = 600ms total)
      startTime: 0,
      targetYear: null,
      phase: 'none' // 'none', 'fadeOut', 'fadeIn'
    };
  }
}

// Create global App instance
let app = new App();

/**
 * p5.js preload()
 * Runs before setup().
 */
function preload() {
  // Load background music
  app.bgMusic = loadSound('bg_music.mp3');
}

/**
 * calculateAgeAndWeeks()
 * Calculates and updates user age and weeks lived
 */
function calculateAgeAndWeeks() {
  if (app.birthDate) {
    let now = new Date();
    let diffTime = now.getTime() - app.birthDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    app.userAge = Math.floor(diffDays / 365.25);
    app.weeksLived = Math.floor(diffDays / 7);
  }
}

/**
 * getWeeksSinceBirth()
 * Wrapper that uses DateUtils function with global birthDate
 * Accepts 2 or 3 parameters for compatibility
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year to calculate for (defaults to currentDisplayYear)
 * @param {Date} [providedBirthDate] - Optional birth date (uses global birthDate if not provided)
 */
function getWeeksSinceBirth(weekIndex, year, providedBirthDate) {
  // Use provided birthDate or app birthDate
  let dateToUse = providedBirthDate || app.birthDate;
  if (!dateToUse) return weekIndex + 1;
  
  // Use provided year or app currentDisplayYear, or fallback to current year
  if (year === undefined) {
    year = app.currentDisplayYear || new Date().getFullYear();
  }
  
  // Use the same logic as DateUtils version
  let weekStartDate = getDateFromWeekIndex(weekIndex, year);
  let diffTime = weekStartDate.getTime() - dateToUse.getTime();
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
    app.circleSize = 40;
    app.xSpacing = app.circleSize + 15;
    app.ySpacing = app.circleSize;
  } else if (windowWidth < 900) {
    // Tablet: medium circles
    app.circleSize = 60;
    app.xSpacing = app.circleSize + 20;
    app.ySpacing = app.circleSize;
  } else if (windowWidth < 1200) {
    // Small desktop: slightly smaller
    app.circleSize = 80;
    app.xSpacing = app.circleSize + 25;
    app.ySpacing = app.circleSize;
  } else {
    // Large desktop: full size
    app.circleSize = 100;
    app.xSpacing = app.circleSize + 30;
    app.ySpacing = app.circleSize;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Set font for all p5.js text (Inter - open source font)
  textFont('Inter');

  // Calculate responsive sizes (after canvas is created)
  calculateResponsiveSizes();
  
  // Note: circleSize, xSpacing, ySpacing are now stored in app properties

  // Initialize starting page
  app.startingPage = new StartingPage();
  
  // Check if birth date already exists
  if (StartingPage.checkIfBirthDateExists()) {
    // Birth date exists - skip intro and go directly to transition
    app.birthDate = StartingPage.getSavedBirthDate();
    calculateAgeAndWeeks();
    // Start transition immediately
    app.startingPage.startTransitionFromExisting();
    app.showStartingPage = true; // Still show starting page to display transition
  } else {
    // No birth date - show intro sequence
    app.showStartingPage = true;
  }

  // --- Audio Setup ---
  app.osc = new p5.Oscillator("sine");
  app.osc.freq(200);
  app.osc.amp(0);
  app.osc.start();

  app.env = new p5.Envelope(0.001, 0.25, 0.04, 0.0);

  // --- Background Music Setup ---
  setupBackgroundMusic();
  startBackgroundMusic();
  
  // --- Modal Event Listeners ---
  setupModalListeners();
  
  // Initialize modalManager with birthDate (will be set when birthDate is available)
  if (app.birthDate) {
    modalManager.setBirthDate(app.birthDate);
  }
  modalManager.setRefreshCallback(refreshCircleData);
  
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
      navigateToYear(app.currentDisplayYear - 1);
    });
  }
  
  let yearNextBtn = document.getElementById('year-next-btn');
  if (yearNextBtn) {
    yearNextBtn.addEventListener('click', function() {
      navigateToYear(app.currentDisplayYear + 1);
    });
  }
  
  // Initialize mouse trail
  app.mouseTrail = new MouseTrail();
  app.mouseTrail.initialize();

  // Initialize goal countdown
  app.goalCountdown = new GoalCountdown();
}

/**
 * p5.js draw()
 * Runs 60 times per second.
 */
function draw() {
  // Background is set by StartingPage during intro, or by backgroundColour in main app
  if (!app.showStartingPage) {
    background(app.backgroundColour);
  }
  
  // Update mouse trail
  if (app.mouseTrail) {
    app.mouseTrail.update(app.showStartingPage);
  }

  if (app.showStartingPage) {
    app.startingPage.display();
    
    // Check if intro sequence is complete
    if (app.startingPage.isComplete()) {
      // Transition complete, initialize main app
      app.birthDate = StartingPage.getSavedBirthDate();
      if (app.birthDate) {
        calculateAgeAndWeeks();
        // Update modalManager with birthDate
        modalManager.setBirthDate(app.birthDate);
        app.showStartingPage = false;
        app.weeks = [];
        initializeMainApp();
      }
    }
    
    // Draw mouse trail on top (even on starting page, but it will be cleared by update)
    if (app.mouseTrail) {
      app.mouseTrail.display(app.showStartingPage);
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

  // Create today date once per frame (used by multiple components)
  let today = new Date();

  // Only check hover states if modal is NOT open and NOT transitioning
  if (!modalOpen && !app.yearTransition.active) {
    for (let week of app.weeks) {
      week.checkHover();
    }
  } else {
    // If modal is open or transitioning, clear all hover states
    for (let week of app.weeks) {
      week.isHovered = false;
    }
  }

  // Update year transition if active
  updateYearTransition();

  // Draw all circles (pass today to avoid creating it 52 times)
  for (let week of app.weeks) {
    week.display(app.currentWeekIndex, app.currentDisplayYear, app.birthDate, today);
  }

  // Draw mouse trail on top of everything
  if (app.mouseTrail) {
    app.mouseTrail.display(app.showStartingPage);
  }
  
  // Update and display goal countdown (only when not on starting page)
  // Pass today to avoid creating it again
  if (!app.showStartingPage && app.goalCountdown && app.birthDate) {
    app.goalCountdown.update(app.birthDate, app.currentDisplayYear, app.currentWeekIndex, today);
    app.goalCountdown.display();
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
  // Pass mouse coordinates to handleClick
  if (app.startingPage) {
    app.startingPage.handleClick(mouseX, mouseY);
  }
  // Main app initialization happens when isComplete() returns true
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
  if (app.showStartingPage) {
    handleStartingPageClick();
    return;
  }

  // Unlock audio on first user interaction
  userStartAudio();
  startBackgroundMusic();
  
  // Check if a goal countdown card was clicked
  if (app.goalCountdown) {
    let clickedGoal = app.goalCountdown.checkClick(mouseX, mouseY);
    if (clickedGoal) {
      // Open the memory in view mode
      if (typeof viewMemory === 'function' && clickedGoal.weeksSinceBirth !== undefined && clickedGoal.memoryId) {
        // Set the selected week to open the modal
        modalManager.selectedWeeksSinceBirth = clickedGoal.weeksSinceBirth;
        // Show the modal
        let modal = document.getElementById('entry-modal');
        if (modal) {
          modal.style.display = 'flex';
          modal.classList.add('show');
          // Disable canvas interaction
          let canvas = document.querySelector('canvas');
          if (canvas) {
            canvas.style.pointerEvents = 'none';
          }
        }
        // View the specific memory
        viewMemory(clickedGoal.weeksSinceBirth, clickedGoal.memoryId);
        return; // Don't check for circle clicks
      }
    }
  }
  
  // Check which circle was clicked
  for (let week of app.weeks) {
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
  // Store weeks since birth as the universal identifier
  modalManager.selectedWeeksSinceBirth = week.weeksSinceBirth;
  
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
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(week.weeksSinceBirth, app.birthDate);
  if (!yearWeekInfo) {
    console.error('Could not determine year and week index for weeks since birth:', week.weeksSinceBirth);
    return;
  }
  
  // Set modal title based on week type
  let currentYear = new Date().getFullYear();
  let isFutureWeek = (yearWeekInfo.year > currentYear) || 
                     (yearWeekInfo.year === currentYear && yearWeekInfo.weekIndex > app.currentWeekIndex);
  
  // Display week number within the year (1-52)
  modalTitle.textContent = isFutureWeek 
    ? `Week ${yearWeekInfo.weekIndex + 1} - Goals`
    : `Week ${yearWeekInfo.weekIndex + 1} - Memories`;
  
  // Reset editing state (we're adding new, not editing)
  modalManager.editingMemoryId = null;
  
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
  
  // Set cancel button text to "Close" when adding new (not editing)
  let cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.textContent = 'Close';
  }
  
  // Ensure input section is shown, view and image edit sections are hidden
  if (typeof showMemoryInputSection === 'function') {
    showMemoryInputSection();
  }
  
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
  for (let w of app.weeks) {
    w.isHovered = false;
  }
}

/**
 * showModal()
 * Displays the modal and disables canvas interaction
 * @param {HTMLElement} modal - The modal element
 * @param {HTMLElement} textInput - The text input element (for backward compatibility)
 */
function showModal(modal, textInput) {
  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Disable canvas interaction
  let canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.pointerEvents = 'none';
  }
  
  // Focus on title input if available, otherwise textarea
  let titleInput = document.getElementById('memory-title-input');
  if (titleInput) {
    titleInput.focus();
  } else if (textInput) {
    textInput.focus();
  }
}


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
  app.weeks = [];
  
  // Reset state variables (but keep birth date in localStorage)
  app.birthDate = null;
  app.userAge = 0;
  app.weeksLived = 0;
  app.showStartingPage = true;
  
  // Don't clear the saved birth date - allow user to re-enter if they want
  // Reset starting page to show the intro sequence again
  app.startingPage = new StartingPage();
}

/**
 * refreshCircleData()
 * Refreshes the data for all circles after memory changes
 * @param {number} year - The year to refresh data for
 */
function refreshCircleData(year) {
  // Only refresh if we're viewing the same year
  if (year !== app.currentDisplayYear) {
    return;
  }
  
  // Reload the year data
  app.yearData = loadData(year);
  
  // Update each circle's data reference and recalculate state
  let today = new Date();
  for (let week of app.weeks) {
    if (week.id >= 0 && week.id < app.yearData.length) {
      week.data = app.yearData[week.id];
      // Recalculate state in case data changed
      week.updateState(app.currentDisplayYear, app.birthDate, today);
    }
  }
}

/**
 * navigateToYear()
 * Navigates to a different year with a smooth fade transition
 * @param {number} year - The year to navigate to
 */
function navigateToYear(year) {
  if (!app.birthDate) return; // Can't navigate without birth date
  
  // Get birth year to prevent navigating before birth
  let birthYear = app.birthDate.getFullYear();
  
  // Prevent navigating to years before birth year
  if (year < birthYear) {
    console.log(`Cannot navigate to year ${year} - before birth year ${birthYear}`);
    return;
  }
  
  // Don't navigate if already transitioning or already on that year
  if (app.yearTransition.active || year === app.currentDisplayYear) {
    return;
  }
  
  // Hide modal if it's open
  let modal = document.getElementById('entry-modal');
  if (modal && modal.classList.contains('show')) {
    hideModal();
  }
  
  // Clear modal state to prevent using stale week identifier
  modalManager.selectedWeeksSinceBirth = null;
  modalManager.editingMemoryId = null;
  
  // Start fade transition
  app.yearTransition.active = true;
  app.yearTransition.phase = 'fadeOut';
  app.yearTransition.alpha = 0;
  app.yearTransition.startTime = millis();
  app.yearTransition.targetYear = year;
}

/**
 * updateYearTransition()
 * Updates the year transition animation state
 */
function updateYearTransition() {
  if (!app.yearTransition.active) return;
  
  const elapsed = millis() - app.yearTransition.startTime;
  const { duration, phase, targetYear } = app.yearTransition;
  
  if (phase === 'fadeOut') {
    // Fade out: alpha goes from 255 to 0
    const alpha = map(elapsed, 0, duration, 255, 0, true);
    
    // Apply alpha to all circles
    for (let week of app.weeks) {
      week.alpha = alpha;
    }
    
    if (elapsed >= duration) {
      // Fade out complete, switch year and start fade in
      app.weeks = [];
      initializeMainApp(targetYear);
      
      // Set new circles to fully transparent
      for (let week of app.weeks) {
        week.alpha = 0;
      }
      
      app.yearTransition.phase = 'fadeIn';
      app.yearTransition.startTime = millis();
    }
  } else if (phase === 'fadeIn') {
    // Fade in: alpha goes from 0 to 255
    const alpha = map(elapsed, 0, duration, 0, 255, true);
    
    // Apply alpha to all circles
    for (let week of app.weeks) {
      week.alpha = alpha;
    }
    
    if (elapsed >= duration) {
      // Transition complete - ensure all circles are fully opaque
      for (let week of app.weeks) {
        week.alpha = 255;
      }
      
      app.yearTransition.active = false;
      app.yearTransition.phase = 'none';
      app.yearTransition.targetYear = null;
    }
  }
}


/**
 * updateNavigationButtons()
 * Updates the visibility and state of navigation buttons
 */
function updateNavigationButtons() {
  let prevBtn = document.getElementById('year-prev-btn');
  let nextBtn = document.getElementById('year-next-btn');
  
  if (!prevBtn || !nextBtn || !app.currentDisplayYear) return;
  
  // Show buttons only when not on starting page
  if (app.showStartingPage) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }
  
  // Show buttons
  prevBtn.style.display = 'flex';
  nextBtn.style.display = 'flex';
  
  // Disable previous button if at or before birth year
  if (app.birthDate) {
    let birthYear = app.birthDate.getFullYear();
    if (app.currentDisplayYear <= birthYear) {
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
  if (app.birthDate) {
    let birthYear = app.birthDate.getFullYear();
    if (year < birthYear) {
      console.log(`Cannot initialize to year ${year} - before birth year ${birthYear}. Using birth year instead.`);
      year = birthYear;
    }
  }
  
  app.currentDisplayYear = year;
  
  let now = new Date();
  let isoWeekInfo = getISOWeekNumber(now);
  app.currentWeekIndex = isoWeekInfo.weekNumber - 1; // Convert to 0-based index
  
  // Only highlight current week if viewing the ISO year (which handles year boundaries correctly)
  if (year !== isoWeekInfo.year) {
    app.currentWeekIndex = -1; // No current week highlight for past/future years
  }

  app.yearData = loadData(year);

  let weekID = 0;
  
  // Calculate the total grid dimensions to center it
  let gridWidth = 8 * app.xSpacing;
  let gridHeight = 7 * app.ySpacing;
  let startX = (width - gridWidth) / 2 + (app.xSpacing / 2);
  
  // Responsive header offset
  let headerOffset = windowWidth < 600 ? 50 : windowWidth < 900 ? 70 : 80;
  let startY = (height - gridHeight) / 2 + headerOffset; // Offset for header

  // Reuse now as today (same value, no need to create new Date)
  let today = now;

  // Loop through 7 and 8rows
  for (let r = 0; r < app.numRows; r++) {
    let y = startY + r * app.ySpacing;
    let isEvenRow = (r % 2 === 0);
    let numCols = isEvenRow ? 7 : 8;
    let xOffset = isEvenRow ? app.xSpacing / 2 : 0;

    for (let c = 0; c < numCols; c++) {
      let x = startX + xOffset + c * app.xSpacing;
      let dataForThisWeek = app.yearData[weekID];
      let weeksSinceBirth = getWeeksSinceBirth(weekID, year);
      let newWeek = new WeekCircle(x, y, app.circleSize, weekID, weeksSinceBirth, dataForThisWeek);

      // Calculate and cache state once when circle is created
      newWeek.updateState(year, app.birthDate, today);

      app.weeks.push(newWeek);
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
  
  // Update existing circles if the app is initialized
  if (!app.showStartingPage && app.weeks.length > 0) {
    // Calculate new grid layout
    let gridWidth = 8 * app.xSpacing;
    let gridHeight = 7 * app.ySpacing;
    let startX = (width - gridWidth) / 2 + (app.xSpacing / 2);
    
    // Responsive header offset
    let headerOffset = windowWidth < 600 ? 50 : windowWidth < 900 ? 70 : 80;
    let startY = (height - gridHeight) / 2 + headerOffset;
    
    // Update each circle's position and size
    let weekID = 0;
    for (let r = 0; r < app.numRows; r++) {
      let y = startY + r * app.ySpacing;
      let isEvenRow = (r % 2 === 0);
      let numCols = isEvenRow ? 7 : 8;
      let xOffset = isEvenRow ? app.xSpacing / 2 : 0;

      for (let c = 0; c < numCols; c++) {
        let x = startX + xOffset + c * app.xSpacing;
        if (weekID < app.weeks.length) {
          // Update existing circle's layout
          app.weeks[weekID].updateLayout(x, y, app.circleSize);
        }
        weekID++;
      }
    }
  }
}

/**
 * getOrdinalSuffix()
 * Returns the ordinal suffix (st, nd, rd, th) for a number
 * @param {number} num - The number to get the suffix for
 * @returns {string} - The ordinal suffix
 */
function getOrdinalSuffix(num) {
  // Handle special cases: 11th, 12th, 13th (not 11st, 12nd, 13rd)
  let lastTwoDigits = num % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }
  
  // Handle regular cases based on last digit
  let lastDigit = num % 10;
  if (lastDigit === 1) return 'st';
  if (lastDigit === 2) return 'nd';
  if (lastDigit === 3) return 'rd';
  return 'th';
}

/**
 * drawHeader()
 * Draws the header showing age and weeks lived, and current year
 */
function drawHeader() {
  if (app.birthDate) {
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
    let yearMargin = topMargin + (windowWidth < 600 ? 25 : windowWidth < 900 ? 30 : 55);
    
    // Format week number with ordinal suffix and comma formatting
    let weekFormatted = app.weeksLived.toLocaleString();
    let weekOrdinal = weekFormatted + getOrdinalSuffix(app.weeksLived);
    text(`You are ${app.userAge} years old. This is your ${weekOrdinal} week.`, 
          width / 2, topMargin);
    
    // Show current year being displayed
    if (app.currentDisplayYear) {
      textStyle(BOLD);
      textSize(yearTextSize);
      let yearText = `Year ${app.currentDisplayYear}`;
      text(yearText, width / 2, yearMargin);
    }
    
    pop();
  }
}