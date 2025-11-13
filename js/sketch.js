/**
 * App Class
 * Encapsulates all application state and logic
 * Note: p5.js requires setup() and draw() to be global functions,
 * so we delegate to this App instance for organization
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
    this.TICK_GAP_MS = 80;   // Small cooldown between sounds
    
    // Background music
    this.bgMusic = null;
    this.musicPlaying = false;
    this.musicVolume = 0.1;  // 10% volume
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
    
    // Rain particles for soulful background effect
    this.rainParticles = [];
    this.currentParticleCount = null; // Track current particle count to detect threshold crossings
    
    // Grid Layout Parameters
    this.numRows = 7;
    this.circleSize = 100;                // Made variable for responsive design
    this.xSpacing = this.circleSize + 30;
    this.ySpacing = this.circleSize;      // Use a tighter vertical spacing for the honeycomb look
    this.backgroundColour = "#F7F6E4";
    
    // Year transition state
    this.yearTransition = {
      active: false,
      alpha: 0,
      duration: 300,    // milliseconds for each fade (out + in = 600ms total)
      startTime: 0,
      targetYear: null,
      phase: 'none'     // 'none', 'fadeOut', 'fadeIn'
    };
    
    // Main page fade-in state (after iris wipe transition)
    this.mainPageFadeIn = {
      active: false,
      alpha: 0,
      duration: 500,    // 500ms fade-in duration
      startTime: 0
    };
    
    // Cached DOM elements (to avoid querying every frame)
    this.cachedHomeBtn = null;
    this.cachedModal = null;
    this.cachedCanvas = null;
    this.cachedModalOpen = false;
    this.lastModalCheck = 0;
    this.MODAL_CHECK_INTERVAL = 100; // Check modal state every 100ms instead of every frame
  }
  
  /**
   * getWeeksSinceBirth()
   * Calculates weeks since birth for a given week index and year
   * @param {number} weekIndex - The week index (0-51)
   * @param {number} year - The year to calculate for
   * @param {Date} [providedBirthDate] - Optional birth date (uses this.birthDate if not provided)
   * @returns {number} - Weeks since birth
   */
  getWeeksSinceBirth(weekIndex, year, providedBirthDate) {
    // Use provided birthDate or this.birthDate
    let dateToUse = providedBirthDate || this.birthDate;
    if (!dateToUse) return weekIndex + 1;
    
    // Use provided year or this.currentDisplayYear, or fallback to current year
    if (year === undefined) {
      year = this.currentDisplayYear || new Date().getFullYear();
    }
    
    // Use the same logic as DateUtils version
    let weekStartDate = getDateFromWeekIndex(weekIndex, year);
    let diffTime = weekStartDate.getTime() - dateToUse.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let weeksSinceBirth = Math.floor(diffDays / 7);
    
    return Math.max(0, weeksSinceBirth);
  }
  
  /**
   * refreshCircleData()
   * Refreshes the data for all circles after memory changes
   * @param {number} year - The year to refresh data for
   */
  refreshCircleData(year) {
    // Only refresh if we're viewing the same year
    if (year !== this.currentDisplayYear) {
      return;
    }
    
    // Reload the year data
    this.yearData = loadData(year);
    
    // Update each circle's data reference and recalculate state
    let today = new Date();
    for (let week of this.weeks) {
      if (week.id >= 0 && week.id < this.yearData.length) {
        week.data = this.yearData[week.id];
        // Recalculate state in case data changed
        week.updateState(this.currentDisplayYear, this.birthDate, today);
      }
    }
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
  app.bgMusic = loadSound('assets/audio/bg_music.mp3');
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
 * getParticleCountForWidth()
 * Returns the appropriate particle count based on window width using discrete thresholds
 * @param {number} width - Current window width
 * @returns {number} - Particle count for this width
 */
function getParticleCountForWidth(width) {
  // Discrete thresholds for particle scaling
  // Only recreates when crossing these breakpoints
  if (width < 600) {
    return 500;   // Mobile
  } else if (width < 800) {
    return 1000;  // Small tablet
  } else if (width < 1000) {
    return 1500;  // Large tablet
  } else if (width < 1200) {
    return 2000;  // Small desktop
  } else {
    return 2500;  // Large desktop
  }
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
  
  // Cache canvas element for performance
  app.cachedCanvas = document.querySelector('canvas');

  // Set font for all p5.js text (Inter - open sauce font)
  textFont('Inter');

  // Calculate responsive sizes
  calculateResponsiveSizes();
  
  // Layout parameters stored in app properties for responsive design

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

  // --- Background Music Setup --- (From AudioManager.js)
  audioManager.setupBackgroundMusic();
  audioManager.startBackgroundMusic();
  
  // --- Modal Event Listeners --- (From ModalManager.js)
  modalManager.setupListeners();
  
  // Initialize modalManager with birthDate (will be set when birthDate is available)
  if (app.birthDate) {
    modalManager.setBirthDate(app.birthDate);
  }
  modalManager.setRefreshCallback(app.refreshCircleData.bind(app));
  
  // --- Music Toggle Button Setup ---
  let musicToggleBtn = document.getElementById('music-toggle-btn');
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', function() {
      audioManager.toggleBackgroundMusic();
    });
    // Initialize icon state
    audioManager.updateMusicIcon();
  }
  
  // --- Home Button Setup ---
  app.cachedHomeBtn = document.getElementById('home-btn');
  if (app.cachedHomeBtn) {
    app.cachedHomeBtn.addEventListener('click', function() {
      returnToHome();
    });
  }
  
  // Cache modal element
  app.cachedModal = document.getElementById('entry-modal');
  
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
  
  // Initialize rain particles - create a few hundred for subtle background effect
  // Use fewer particles on mobile for better performance, scaling up with screen size
  app.rainParticles = [];
  let numParticles = getParticleCountForWidth(windowWidth);
  app.currentParticleCount = numParticles; // Track initial count
  for (let i = 0; i < numParticles; i++) {
    app.rainParticles.push(new RainParticle());
  }
}

/**
 * p5.js draw()
 * Runs 60 times per second.
 */
function draw() {
  // Background is set by StartingPage during intro, or by backgroundColour in main app
  if (!app.showStartingPage) {
    background(app.backgroundColour);
    
    // Draw rain particles first (behind everything else)
    // Apply fade-in alpha if active
    if (app.mainPageFadeIn.active) {
      push();
      drawingContext.globalAlpha = app.mainPageFadeIn.alpha / 255;
      for (let particle of app.rainParticles) {
        particle.update();
        particle.display();
      }
      pop();
    } else {
      for (let particle of app.rainParticles) {
        particle.update();
        particle.display();
      }
    }
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
        // Start fade-in animation
        app.mainPageFadeIn.active = true;
        app.mainPageFadeIn.alpha = 0;
        app.mainPageFadeIn.startTime = millis();
      }
    }
    
    // Draw mouse trail on top
    if (app.mouseTrail) {
      app.mouseTrail.display(app.showStartingPage);
    }
    // Hide home button and navigation buttons on starting page
    if (app.cachedHomeBtn) {
      app.cachedHomeBtn.style.display = 'none';
    }
    // Navigation buttons hidden on starting page
    updateNavigationButtons();
    return;
  }
  
  // Show home button when not on starting page
  if (app.cachedHomeBtn) {
    app.cachedHomeBtn.style.display = 'flex';
  }
  
  // Update navigation buttons visibility
  updateNavigationButtons();

  // Draw header with age info (apply fade-in alpha if active)
  if (app.mainPageFadeIn.active) {
    push();
    drawingContext.globalAlpha = app.mainPageFadeIn.alpha / 255;
    drawHeader();
    pop();
  } else {
    drawHeader();
  }

  // Check if modal is open
  let modalOpen = isModalOpen();

  // Create today date once per frame (used by multiple components)
  let today = new Date();

  // Cache interaction coordinates once per frame (avoid checking touches.length 52 times)
  // This is a performance optimization for mobile browsers
  // Validate touch coordinates are valid numbers before using them (fixes GitHub Pages freeze)
  let interactionX, interactionY;
  if (typeof touches !== 'undefined' && touches.length > 0 && 
      typeof touchX !== 'undefined' && typeof touchY !== 'undefined' &&
      !isNaN(touchX) && !isNaN(touchY) &&
      isFinite(touchX) && isFinite(touchY)) {
    interactionX = touchX;
    interactionY = touchY;
  } else {
    interactionX = mouseX;
    interactionY = mouseY;
  }

  // Only check hover states if modal is NOT open and NOT transitioning
  if (!modalOpen && !app.yearTransition.active) {
    for (let week of app.weeks) {
      week.checkHover(interactionX, interactionY);
    }
  } else {
    // If modal is open or transitioning, clear all hover states
    for (let week of app.weeks) {
      week.isHovered = false;
    }
  }

  // Update year transition if active
  updateYearTransition();
  
  // Update main page fade-in if active
  updateMainPageFadeIn();

  // Draw all circles (pass today to avoid creating it 52 times)
  // Apply fade-in alpha if active
  let mainPageAlpha = app.mainPageFadeIn.active ? app.mainPageFadeIn.alpha : 255;
  for (let week of app.weeks) {
    // Temporarily override circle's alpha for fade-in
    let originalAlpha = week.alpha;
    if (app.mainPageFadeIn.active) {
      week.alpha = mainPageAlpha;
    }
    week.display(app.currentWeekIndex, app.currentDisplayYear, app.birthDate, today);
    week.alpha = originalAlpha; // Restore original alpha
  }

  // Draw mouse trail on top of everything
  if (app.mouseTrail) {
    app.mouseTrail.display(app.showStartingPage);
  }
  
  // Update and display goal countdown (only when not on starting page)
  // Pass today to avoid creating it again
  // Apply fade-in alpha if active
  if (!app.showStartingPage && app.goalCountdown && app.birthDate) {
    app.goalCountdown.update(app.birthDate, app.currentDisplayYear, app.currentWeekIndex, today);
    if (app.mainPageFadeIn.active) {
      push();
      drawingContext.globalAlpha = app.mainPageFadeIn.alpha / 255;
      app.goalCountdown.display();
      pop();
    } else {
      app.goalCountdown.display();
    }
  }
}

/**
 * isModalOpen()
 * Checks if the modal is currently open (cached, only checks periodically)
 * @returns {boolean} - True if modal is open
 */
function isModalOpen() {
  // Only check modal state periodically to avoid DOM queries every frame
  let now = millis();
  if (now - app.lastModalCheck > app.MODAL_CHECK_INTERVAL) {
    if (app.cachedModal) {
      app.cachedModalOpen = app.cachedModal.classList.contains('show');
    } else {
      // Fallback if cached modal is null
      app.cachedModal = document.getElementById('entry-modal');
      app.cachedModalOpen = app.cachedModal && app.cachedModal.classList.contains('show');
    }
    app.lastModalCheck = now;
  }
  return app.cachedModalOpen;
}

/**
 * getInteractionX()
 * Gets the current X coordinate from mouse or touch
 * @returns {number} - X coordinate
 */
function getInteractionX() {
  if (typeof touches !== 'undefined' && touches.length > 0 && 
      typeof touchX !== 'undefined' && !isNaN(touchX) && isFinite(touchX)) {
    return touchX;
  }
  return mouseX;
}

/**
 * getInteractionY()
 * Gets the current Y coordinate from mouse or touch
 * @returns {number} - Y coordinate
 */
function getInteractionY() {
  if (typeof touches !== 'undefined' && touches.length > 0 && 
      typeof touchY !== 'undefined' && !isNaN(touchY) && isFinite(touchY)) {
    return touchY;
  }
  return mouseY;
}

/**
 * isButtonClick()
 * Checks if the click is on a button element
 * @param {number} x - X coordinate (optional, uses current interaction point if not provided)
 * @param {number} y - Y coordinate (optional, uses current interaction point if not provided)
 * @returns {boolean} - True if click is on a button
 */
function isButtonClick(x, y) {
  let canvas = app.cachedCanvas;
  if (!canvas) return false;
  
  let coordX = x !== undefined ? x : getInteractionX();
  let coordY = y !== undefined ? y : getInteractionY();
  
  let rect = canvas.getBoundingClientRect();
  let screenX = rect.left + coordX;
  let screenY = rect.top + coordY;
  let elementAtPoint = document.elementFromPoint(screenX, screenY);
  
  return elementAtPoint && (elementAtPoint.tagName === 'BUTTON' || elementAtPoint.closest('button'));
}

/**
 * handleStartingPageClick()
 * Handles clicks on the starting page
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function handleStartingPageClick(x, y) {
  // Pass coordinates to handleClick
  if (app.startingPage) {
    app.startingPage.handleClick(x, y);
  }
  // Main app initialization happens when isComplete() returns true
}

/**
 * isClickOnCircle()
 * Checks if the click is on a specific circle
 * @param {WeekCircle} week - The week circle to check
 * @param {number} x - X coordinate (optional, uses current interaction point if not provided)
 * @param {number} y - Y coordinate (optional, uses current interaction point if not provided)
 * @returns {boolean} - True if click is on the circle
 */
function isClickOnCircle(week, x, y) {
  let coordX = x !== undefined ? x : getInteractionX();
  let coordY = y !== undefined ? y : getInteractionY();
  
  // Only validate if coordinates came from fallback (touch coordinates might be invalid)
  // If x/y were passed directly (from mousePressed/touchStarted), they're already validated
  if (x === undefined || y === undefined) {
    // Coordinates came from fallback - validate they're valid numbers
    if (isNaN(coordX) || isNaN(coordY) || !isFinite(coordX) || !isFinite(coordY)) {
      return false;
    }
  }
  
  let d = dist(coordX, coordY, week.x, week.y);
  return d < week.baseSize / 2;
}

/**
 * handleInteraction()
 * Shared handler for both mouse and touch interactions
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function handleInteraction(x, y) {
  // Skip click processing if modal is open
  if (isModalOpen()) return;
  
  // Skip click processing if clicking on a button
  if (isButtonClick(x, y)) return;

  // Handle starting page clicks
  if (app.showStartingPage) {
    handleStartingPageClick(x, y);
    return;
  }

  // Unlock audio on first user interaction
  userStartAudio();
  audioManager.startBackgroundMusic();
  
  // Check if a goal countdown card was clicked
  if (app.goalCountdown) {
    let clickedGoal = app.goalCountdown.checkClick(x, y);
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
          if (app.cachedCanvas) {
            app.cachedCanvas.style.pointerEvents = 'none';
          }
        }
        // View the specific memory
        viewMemory(clickedGoal.weeksSinceBirth, clickedGoal.memoryId);
        return; // Skip circle click detection
      }
    }
  }
  
  // Check which circle was clicked
  for (let week of app.weeks) {
    if (week.isBeforeBirth) continue;
    
    if (isClickOnCircle(week, x, y)) {
      showWeekModal(week);
      break;
    }
  }
}

function mousePressed() {
  handleInteraction(mouseX, mouseY);
}

function touchStarted() {
  // Use the first touch point
  // In p5.js, touchX/touchY should be available, but use touches array as fallback
  let x, y;
  if (typeof touches !== 'undefined' && touches.length > 0) {
    // Use touchX/touchY if valid, otherwise use touches[0]
    if (typeof touchX !== 'undefined' && typeof touchY !== 'undefined' &&
        !isNaN(touchX) && !isNaN(touchY) && 
        isFinite(touchX) && isFinite(touchY)) {
      x = touchX;
      y = touchY;
    } else if (touches[0]) {
      x = touches[0].x;
      y = touches[0].y;
    } else {
      return true; // No valid touch coordinates, allow event to propagate to HTML elements
    }
    
    // Check if touch is on a button or HTML element first
    if (app.cachedCanvas) {
      let rect = app.cachedCanvas.getBoundingClientRect();
      let screenX = rect.left + x;
      let screenY = rect.top + y;
      let elementAtPoint = document.elementFromPoint(screenX, screenY);
      
      // If touch is on an HTML element (button, input, etc.), allow it to work normally
      if (elementAtPoint && (elementAtPoint.tagName === 'BUTTON' || 
          elementAtPoint.tagName === 'INPUT' || 
          elementAtPoint.tagName === 'TEXTAREA' ||
          elementAtPoint.closest('button') ||
          elementAtPoint.closest('input') ||
          elementAtPoint.closest('textarea'))) {
        return true; // Allow default behavior for HTML elements
      }
    }
    
    // Touch is on canvas, handle it and prevent default scrolling/zooming
    handleInteraction(x, y);
    return false; // Prevent default touch behavior (scrolling, zooming) only for canvas touches
  }
  return true; // Allow event to propagate if no touches detected
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
  
  // Reset editing state
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
  
  // Show input section, hide view and image edit sections
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
 * @param {HTMLElement} textInput - The text input element
 */
function showModal(modal, textInput) {
  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Disable canvas interaction
  if (app.cachedCanvas) {
    app.cachedCanvas.style.pointerEvents = 'none';
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
  
  // Reset fade-in state
  app.mainPageFadeIn.active = false;
  app.mainPageFadeIn.alpha = 255;
  
  // Keep saved birth date to allow user to re-enter if desired
  // Reset starting page to show the intro sequence again
  app.startingPage = new StartingPage();
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
    console.error(`Cannot navigate to year ${year} - before birth year ${birthYear}`);
    return;
  }
  
  // Skip navigation if already transitioning or already on that year
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
 * updateMainPageFadeIn()
 * Updates the main page fade-in animation state (after iris wipe transition)
 */
function updateMainPageFadeIn() {
  if (!app.mainPageFadeIn.active) return;
  
  const elapsed = millis() - app.mainPageFadeIn.startTime;
  const { duration } = app.mainPageFadeIn;
  
  // Fade in: alpha goes from 0 to 255
  const alpha = map(elapsed, 0, duration, 0, 255, true);
  app.mainPageFadeIn.alpha = alpha;
  
  // Fade-in complete
  if (elapsed >= duration) {
    app.mainPageFadeIn.active = false;
    app.mainPageFadeIn.alpha = 255;
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
  
  // Prevent navigation before birth year
  if (app.birthDate) {
    let birthYear = app.birthDate.getFullYear();
    if (year < birthYear) {
      console.error(`Cannot initialize to year ${year} - before birth year ${birthYear}. Using birth year instead.`);
      year = birthYear;
    }
  }
  
  app.currentDisplayYear = year;
  
  let now = new Date();
  let isoWeekInfo = getISOWeekNumber(now);
  app.currentWeekIndex = isoWeekInfo.weekNumber - 1; // Convert to 0-based index
  
  // Only highlight current week if viewing the ISO year
  if (year !== isoWeekInfo.year) {
    app.currentWeekIndex = -1;                       // No current week highlight for past/future years
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
      let weeksSinceBirth = app.getWeeksSinceBirth(weekID, year);
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
  
  // Dynamically adjust rain particles if crossing any threshold
  // Only adjust if app is initialized (not on starting page)
  if (!app.showStartingPage && app.rainParticles.length > 0) {
    let targetParticles = getParticleCountForWidth(windowWidth);
    // Only recreate particles if we've crossed a threshold
    if (app.currentParticleCount !== targetParticles) {
      app.rainParticles = [];
      for (let i = 0; i < targetParticles; i++) {
        app.rainParticles.push(new RainParticle());
      }
      app.currentParticleCount = targetParticles; // Update tracked count
    }
  }
  
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