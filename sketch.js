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

// Modal state
let selectedWeekIndex = null;
let editingMemoryId = null; // ID of memory being edited, null if adding new

// Mouse trail
let mouseTrail;

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

/**
 * formatDateForInput()
 * Formats a Date object as YYYY-MM-DD in local timezone (not UTC)
 * This prevents timezone shifts when setting min/max on date inputs
 * @param {Date} date - The date to format
 * @returns {string} - Date string in YYYY-MM-DD format
 */
function formatDateForInput(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * getWeekDateRange()
 * Gets the start (Monday) and end (Sunday) dates for a given week index
 * ISO 8601 weeks start on Monday (day 1) and end on Sunday (day 0)
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year
 * @returns {Object} - Object with startDate (Monday) and endDate (Sunday) as Date objects
 */
function getWeekDateRange(weekIndex, year) {
  // Get the Thursday of the week (ISO week reference point)
  let weekThursday = getDateFromWeekIndex(weekIndex, year);
  
  // Calculate Monday (start of ISO week)
  // Thursday is day 4 (getDay() returns 4), Monday is day 1
  // So we subtract exactly 3 days: 4 - 3 = 1 (Monday)
  let monday = new Date(weekThursday);
  // Get the day of week for Thursday (should be 4)
  let thursdayDayOfWeek = weekThursday.getDay();
  // Calculate days to subtract to get to Monday (1)
  // If Thursday is day 4, we need to go back 3 days: 4 - 1 = 3
  let daysToMonday = thursdayDayOfWeek - 1;
  // Handle Sunday (0) case - if Thursday is actually Sunday (shouldn't happen, but safety check)
  if (thursdayDayOfWeek === 0) {
    daysToMonday = 6; // Go back 6 days from Sunday to get Monday
  }
  monday.setDate(weekThursday.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0); // Set to start of day
  
  // Calculate Sunday (end of ISO week) - exactly 6 days after Monday
  let sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999); // Set to end of day
  
  return {
    startDate: monday,
    endDate: sunday
  };
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
  createCanvas(windowWidth, windowHeight);

  // Calculate responsive sizes
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
  
  // Initialize mouse trail
  mouseTrail = new MouseTrail();
  mouseTrail.initialize();
}

/**
 * setupModalListeners()
 * Sets up event listeners for the modal Save and Cancel buttons
 */
function setupModalListeners() {
  // Cancel button
  let cancelBtn = document.getElementById('modal-cancel-btn');
  cancelBtn.addEventListener('click', function() {
    hideModal();
  });
  
  // Save button
  let saveBtn = document.getElementById('modal-save-btn');
  saveBtn.addEventListener('click', function() {
    if (selectedWeekIndex !== null) {
      let textInput = document.getElementById('modal-text-input');
      let dateInput = document.getElementById('memory-date-input');
      let text = textInput.value.trim();
      let date = dateInput.value;
      
      if (!text) {
        alert('Please enter a memory or goal.');
        return;
      }
      
      if (!date) {
        alert('Please select a date.');
        return;
      }
      
      // Validate that the date is within the selected week's range
      let currentYear = new Date().getFullYear();
      let weekRange = getWeekDateRange(selectedWeekIndex, currentYear);
      let selectedDate = new Date(date);
      
      if (selectedDate < weekRange.startDate || selectedDate > weekRange.endDate) {
        alert('The date must be within Week ' + (selectedWeekIndex + 1) + ' (Monday to Sunday).');
        return;
      }
      
      if (editingMemoryId !== null) {
        // Editing existing memory
        editMemory(selectedWeekIndex, editingMemoryId, text, date);
        // Close modal after editing
        hideModal();
      } else {
        // Adding new memory
        addMemory(selectedWeekIndex, text, date);
        // Keep modal open, just refresh list and clear form
        displayMemoriesList(selectedWeekIndex);
        textInput.value = '';
        
        // Reset date to default within the week range
        let currentYear = new Date().getFullYear();
        let weekRange = getWeekDateRange(selectedWeekIndex, currentYear);
        let today = new Date();
        let defaultDate = weekRange.startDate;
        if (today >= weekRange.startDate && today <= weekRange.endDate) {
          defaultDate = today;
        }
        dateInput.value = formatDateForInput(defaultDate);
        
        textInput.focus();
      }
    }
  });
  
  // Close modal when clicking outside of it
  let modal = document.getElementById('entry-modal');
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      hideModal();
    }
  });
  
  // Prevent clicks on modal content from propagating to background
  let modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
}

/**
 * hideModal()
 * Hides the modal and clears the input
 */
function hideModal() {
  let modal = document.getElementById('entry-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
  
  // Re-enable canvas interaction
  let canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.pointerEvents = 'auto';
  }
  
  let textInput = document.getElementById('modal-text-input');
  if (textInput) {
    textInput.value = '';
  }
  
  let dateInput = document.getElementById('memory-date-input');
  if (dateInput) {
    dateInput.value = '';
  }
  
  // Reset save button text
  let saveBtn = document.getElementById('modal-save-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Add';
  }
  
  selectedWeekIndex = null;
  editingMemoryId = null;
}

/**
 * addMemory()
 * Adds a new memory to the specified week
 */
function addMemory(weekIndex, text, date) {
  if (!yearData[weekIndex].memories) {
    yearData[weekIndex].memories = [];
  }
  
  let newMemory = {
    id: generateMemoryId(),
    text: text,
    date: date,
    timestamp: new Date().toISOString()
  };
  
  yearData[weekIndex].memories.push(newMemory);
  
  // Sort memories by date (newest first)
  yearData[weekIndex].memories.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  saveData(yearData);
}

/**
 * editMemory()
 * Edits an existing memory
 */
function editMemory(weekIndex, memoryId, text, date) {
  if (!yearData[weekIndex].memories) {
    return;
  }
  
  let memory = yearData[weekIndex].memories.find(m => m.id === memoryId);
  if (memory) {
    memory.text = text;
    memory.date = date;
    memory.timestamp = new Date().toISOString();
    
    // Re-sort after edit
    yearData[weekIndex].memories.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    saveData(yearData);
  }
}

/**
 * deleteMemory()
 * Deletes a memory after confirmation
 */
function deleteMemory(weekIndex, memoryId) {
  if (!confirm('Are you sure you want to delete this memory?')) {
    return;
  }
  
  if (!yearData[weekIndex].memories) {
    return;
  }
  
  yearData[weekIndex].memories = yearData[weekIndex].memories.filter(m => m.id !== memoryId);
  saveData(yearData);
  
  // Refresh the memories list
  displayMemoriesList(weekIndex);
}

/**
 * displayMemoriesList()
 * Displays the list of memories for the selected week
 */
function displayMemoriesList(weekIndex) {
  let memoriesList = document.getElementById('memories-list');
  if (!memoriesList) return;
  
  memoriesList.innerHTML = '';
  
  if (!yearData[weekIndex] || !yearData[weekIndex].memories || yearData[weekIndex].memories.length === 0) {
    memoriesList.innerHTML = '<div class="empty-memories">No memories yet. Add your first memory below!</div>';
    return;
  }
  
  // Sort memories by date (newest first)
  let sortedMemories = [...yearData[weekIndex].memories].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  sortedMemories.forEach(memory => {
    let memoryItem = document.createElement('div');
    memoryItem.className = 'memory-item';
    
    // Format date for display
    let displayDate = new Date(memory.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    memoryItem.innerHTML = `
      <div class="memory-item-header">
        <span class="memory-item-date">${displayDate}</span>
        <div class="memory-item-actions">
          <button class="memory-edit-btn" data-memory-id="${memory.id}">Edit</button>
          <button class="memory-delete-btn" data-memory-id="${memory.id}">Delete</button>
        </div>
      </div>
      <div class="memory-item-text">${escapeHtml(memory.text)}</div>
    `;
    
    memoriesList.appendChild(memoryItem);
  });
  
  // Add event listeners for edit and delete buttons
  memoriesList.querySelectorAll('.memory-edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      let memoryId = btn.getAttribute('data-memory-id');
      startEditingMemory(weekIndex, memoryId);
    });
  });
  
  memoriesList.querySelectorAll('.memory-delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      let memoryId = btn.getAttribute('data-memory-id');
      deleteMemory(weekIndex, memoryId);
    });
  });
}

/**
 * startEditingMemory()
 * Loads a memory into the edit form
 */
function startEditingMemory(weekIndex, memoryId) {
  if (!yearData[weekIndex].memories) {
    return;
  }
  
  let memory = yearData[weekIndex].memories.find(m => m.id === memoryId);
  if (!memory) {
    return;
  }
  
  editingMemoryId = memoryId;
  
  // Update save button text to "Save" when editing
  let saveBtn = document.getElementById('modal-save-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Save';
  }
  
  let textInput = document.getElementById('modal-text-input');
  let dateInput = document.getElementById('memory-date-input');
  
  if (textInput) {
    textInput.value = memory.text;
  }
  
  if (dateInput) {
    // Get the current year
    let currentYear = new Date().getFullYear();
    
    // Get the week's date range (Monday to Sunday)
    let weekRange = getWeekDateRange(weekIndex, currentYear);
    
    // Format dates as YYYY-MM-DD for input min/max
    let minDate = formatDateForInput(weekRange.startDate);
    let maxDate = formatDateForInput(weekRange.endDate);
    
    // Set min and max to limit date selection to the week
    dateInput.setAttribute('min', minDate);
    dateInput.setAttribute('max', maxDate);
    
    // Set the memory's date (but ensure it's within the week range)
    let memoryDate = new Date(memory.date);
    if (memoryDate < weekRange.startDate) {
      dateInput.value = minDate;
    } else if (memoryDate > weekRange.endDate) {
      dateInput.value = maxDate;
    } else {
      dateInput.value = memory.date;
    }
  }
  
  // Scroll to input section
  let inputSection = document.getElementById('memory-input-section');
  if (inputSection) {
    inputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    textInput.focus();
  }
}

/**
 * escapeHtml()
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  let div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
    return;
  }

  // Draw header with age info
  drawHeader();

  // Check if modal is open
  let modal = document.getElementById('entry-modal');
  let isModalOpen = modal && modal.classList.contains('show');

  let anyHoveredThisFrame = false;

  // Only check hover states if modal is NOT open
  if (!isModalOpen) {
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
    week.display(currentWeekIndex);
  }

  // Draw mouse trail on top of everything
  if (mouseTrail) {
    mouseTrail.display(showStartingPage);
  }
}

/**
 * p5.js mousePressed()
 * Runs once every time the mouse is clicked.
 */
function mousePressed() {
  // Don't process clicks if modal is open
  let modal = document.getElementById('entry-modal');
  if (modal && modal.classList.contains('show')) {
    return;
  }

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
    // Check if mouse is over this circle at the moment of click
    let d = dist(mouseX, mouseY, week.x, week.y);
    
    // Check if distance is less than half the size (the radius)
    if (d < week.baseSize / 2) {
      console.log('Week circle clicked:', week.id);
      // Store which week was clicked
      selectedWeekIndex = week.id;
      
      // Get modal elements
      let modal = document.getElementById('entry-modal');
      let modalTitle = document.getElementById('modal-title');
      let textInput = document.getElementById('modal-text-input');
      
      // Check if elements exist
      if (!modal || !modalTitle || !textInput) {
        console.error('Modal elements not found!');
        return;
      }
      
      // Set modal title based on week type
      if (week.id > currentWeekIndex) {
        modalTitle.textContent = "Week " + (week.id + 1) + " - Goals";
      } else {
        modalTitle.textContent = "Week " + (week.id + 1) + " - Memories";
      }
      
      // Reset editing state (we're adding new, not editing)
      editingMemoryId = null;
      
      // Update save button text
      let saveBtn = document.getElementById('modal-save-btn');
      if (saveBtn) {
        saveBtn.textContent = 'Add';
      }
      
      // Clear inputs for new memory
      textInput.value = '';
      let dateInput = document.getElementById('memory-date-input');
      if (dateInput) {
        // Get the current year
        let currentYear = new Date().getFullYear();
        
        // Get the week's date range (Monday to Sunday)
        let weekRange = getWeekDateRange(week.id, currentYear);
        
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
      
      // Display existing memories list
      displayMemoriesList(week.id);
      
      // Clear all hover states before showing modal
      for (let w of weeks) {
        w.isHovered = false;
      }
      
      // Show the modal
      modal.style.display = 'flex';
      modal.classList.add('show');
      
      // Disable canvas interaction
      let canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.pointerEvents = 'none';
      }
      
      // Focus on textarea
      textInput.focus();
      
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
      let weeksSinceBirth = getWeeksSinceBirth(weekID);
      let newWeek = new WeekCircle(x, y, circleSize, weekID, weeksSinceBirth, dataForThisWeek);
      weeks.push(newWeek);
      weekID++;
    }
  }
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
    initializeMainApp();
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
    
    // Responsive text size
    let headerTextSize = windowWidth < 600 ? 16 : windowWidth < 900 ? 20 : 24;
    textSize(headerTextSize);
    textStyle(ITALIC);
    
    // Responsive top margin
    let topMargin = windowWidth < 600 ? 20 : windowWidth < 900 ? 40 : 60;
    
    text(`You are ${userAge} years old, which means you have lived for ${weeksLived.toLocaleString()} weeks`, 
          width / 2, topMargin);
    pop();
  }
}