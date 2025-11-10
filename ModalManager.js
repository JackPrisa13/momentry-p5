/**
 * ModalManager.js
 * Handles all modal dialog and memory management functionality
 * 
 * Note: This module relies on global variables from sketch.js:
 * - selectedWeeksSinceBirth: The currently selected week's weeks since birth (universal identifier)
 * - editingMemoryId: The ID of the memory being edited (null if adding new)
 * - birthDate: The user's birth date (needed for mapping weeks since birth to year/weekIndex)
 */

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
    if (selectedWeeksSinceBirth !== null && birthDate) {
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
      
      // Convert weeks since birth to year and week index
      let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(selectedWeeksSinceBirth, birthDate);
      if (!yearWeekInfo) {
        alert('Error: Could not determine week information.');
        return;
      }
      
      // Validate that the date is within the selected week's range
      let weekRange = getWeekDateRange(yearWeekInfo.weekIndex, yearWeekInfo.year);
      let selectedDate = new Date(date);
      
      if (selectedDate < weekRange.startDate || selectedDate > weekRange.endDate) {
        alert('The date must be within Week ' + (yearWeekInfo.weekIndex + 1) + ' (Monday to Sunday).');
        return;
      }
      
      if (editingMemoryId !== null) {
        // Editing existing memory
        editMemory(selectedWeeksSinceBirth, editingMemoryId, text, date);
        // Keep modal open, refresh list, and reset to "add new" mode
        displayMemoriesList(selectedWeeksSinceBirth);
        
        // Clear editing state
        editingMemoryId = null;
        
        // Reset save button text
        let saveBtn = document.getElementById('modal-save-btn');
        if (saveBtn) {
          saveBtn.textContent = 'Add';
        }
        
        // Clear form
        textInput.value = '';
        
        // Reset date to default within the week range
        let today = new Date();
        let defaultDate = weekRange.startDate;
        if (today >= weekRange.startDate && today <= weekRange.endDate) {
          defaultDate = today;
        }
        dateInput.value = formatDateForInput(defaultDate);
        
        textInput.focus();
      } else {
        // Adding new memory
        addMemory(selectedWeeksSinceBirth, text, date);
        // Keep modal open, just refresh list and clear form
        displayMemoriesList(selectedWeeksSinceBirth);
        textInput.value = '';
        
        // Reset date to default within the week range
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
 * Hides the modal and re-enables canvas interaction
 */
function hideModal() {
  let modal = document.getElementById('entry-modal');
  let canvas = document.querySelector('canvas');
  
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
  
  if (canvas) {
    canvas.style.pointerEvents = 'auto';
  }
  
  // Clear form inputs
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
  
  selectedWeeksSinceBirth = null;
  editingMemoryId = null;
}

/**
 * getYearDataForWeek()
 * Helper function to get year data for a week
 * @param {number} weeksSinceBirth - Weeks since birth
 * @returns {Object|null} - { yearData, yearWeekInfo } or null if error
 */
function getYearDataForWeek(weeksSinceBirth) {
  if (!birthDate) {
    console.error('Cannot access memory: birthDate not set');
    return null;
  }
  
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, birthDate);
  if (!yearWeekInfo) {
    console.error('Could not determine year and week index for weeks since birth:', weeksSinceBirth);
    return null;
  }
  
  let yearData = loadData(yearWeekInfo.year);
  
  return { yearData, yearWeekInfo };
}

/**
 * saveYearDataAndRefresh()
 * Helper function to save year data and refresh circles
 * @param {Object[]} yearData - The year data to save
 * @param {number} year - The year
 */
function saveYearDataAndRefresh(yearData, year) {
  saveData(yearData, year);
  
  if (typeof refreshCircleData === 'function') {
    refreshCircleData(year);
  }
}

/**
 * sortMemoriesByDate()
 * Helper function to sort memories by date (newest first)
 * @param {Object[]} memories - Array of memory objects
 */
function sortMemoriesByDate(memories) {
  memories.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * addMemory()
 * Adds a new memory to the specified week
 * @param {number} weeksSinceBirth - The weeks since birth for this week (universal identifier)
 * @param {string} text - The memory text
 * @param {string} date - The memory date (YYYY-MM-DD)
 */
function addMemory(weeksSinceBirth, text, date) {
  let result = getYearDataForWeek(weeksSinceBirth);
  if (!result) return;
  
  let { yearData, yearWeekInfo } = result;
  
  if (!yearData[yearWeekInfo.weekIndex].memories) {
    yearData[yearWeekInfo.weekIndex].memories = [];
  }
  
  let newMemory = {
    id: generateMemoryId(),
    text: text,
    date: date,
    timestamp: new Date().toISOString()
  };
  
  yearData[yearWeekInfo.weekIndex].memories.push(newMemory);
  sortMemoriesByDate(yearData[yearWeekInfo.weekIndex].memories);
  
  saveYearDataAndRefresh(yearData, yearWeekInfo.year);
}

/**
 * editMemory()
 * Edits an existing memory
 * @param {number} weeksSinceBirth - The weeks since birth for this week (universal identifier)
 * @param {string} memoryId - The ID of the memory to edit
 * @param {string} text - The memory text
 * @param {string} date - The memory date (YYYY-MM-DD)
 */
function editMemory(weeksSinceBirth, memoryId, text, date) {
  let result = getYearDataForWeek(weeksSinceBirth);
  if (!result) return;
  
  let { yearData, yearWeekInfo } = result;
  
  if (!yearData[yearWeekInfo.weekIndex].memories) {
    return;
  }
  
  let memory = yearData[yearWeekInfo.weekIndex].memories.find(m => m.id === memoryId);
  if (!memory) return;
  
  memory.text = text;
  memory.date = date;
  memory.timestamp = new Date().toISOString();
  
  sortMemoriesByDate(yearData[yearWeekInfo.weekIndex].memories);
  saveYearDataAndRefresh(yearData, yearWeekInfo.year);
}

/**
 * deleteMemory()
 * Deletes a memory after confirmation
 * @param {number} weeksSinceBirth - The weeks since birth for this week (universal identifier)
 * @param {string} memoryId - The ID of the memory to delete
 */
function deleteMemory(weeksSinceBirth, memoryId) {
  if (!confirm('Are you sure you want to delete this memory?')) {
    return;
  }
  
  let result = getYearDataForWeek(weeksSinceBirth);
  if (!result) return;
  
  let { yearData, yearWeekInfo } = result;
  
  if (!yearData[yearWeekInfo.weekIndex].memories) {
    return;
  }
  
  yearData[yearWeekInfo.weekIndex].memories = 
    yearData[yearWeekInfo.weekIndex].memories.filter(m => m.id !== memoryId);
  
  saveYearDataAndRefresh(yearData, yearWeekInfo.year);
  displayMemoriesList(weeksSinceBirth);
}

/**
 * displayMemoriesList()
 * Displays the list of memories for the selected week
 * @param {number} weeksSinceBirth - The weeks since birth for this week (universal identifier)
 */
function displayMemoriesList(weeksSinceBirth) {
  let memoriesList = document.getElementById('memories-list');
  if (!memoriesList) return;
  
  memoriesList.innerHTML = '';
  
  if (!birthDate) {
    console.error('Cannot display memories: birthDate not set');
    return;
  }
  
  // Convert weeks since birth to year and week index
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, birthDate);
  if (!yearWeekInfo) {
    console.error('Could not determine year and week index for weeks since birth:', weeksSinceBirth);
    memoriesList.innerHTML = '<div class="empty-memories">Error loading memories.</div>';
    return;
  }
  
  // Load the correct year's data
  let yearDataForWeek = loadData(yearWeekInfo.year);
  
  if (!yearDataForWeek[yearWeekInfo.weekIndex] || !yearDataForWeek[yearWeekInfo.weekIndex].memories || yearDataForWeek[yearWeekInfo.weekIndex].memories.length === 0) {
    memoriesList.innerHTML = '<div class="empty-memories">No memories yet. Add your first memory below!</div>';
    return;
  }
  
  // Sort memories by date (newest first)
  let sortedMemories = [...yearDataForWeek[yearWeekInfo.weekIndex].memories].sort((a, b) => {
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
      startEditingMemory(weeksSinceBirth, memoryId);
    });
  });
  
  memoriesList.querySelectorAll('.memory-delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      let memoryId = btn.getAttribute('data-memory-id');
      deleteMemory(weeksSinceBirth, memoryId);
    });
  });
}

/**
 * startEditingMemory()
 * Loads a memory into the edit form
 * @param {number} weeksSinceBirth - The weeks since birth for this week (universal identifier)
 * @param {string} memoryId - The ID of the memory to edit
 */
function startEditingMemory(weeksSinceBirth, memoryId) {
  if (!birthDate) {
    console.error('Cannot start editing memory: birthDate not set');
    return;
  }
  
  // Convert weeks since birth to year and week index
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, birthDate);
  if (!yearWeekInfo) {
    console.error('Could not determine year and week index for weeks since birth:', weeksSinceBirth);
    return;
  }
  
  // Load the correct year's data
  let yearDataForWeek = loadData(yearWeekInfo.year);
  
  if (!yearDataForWeek[yearWeekInfo.weekIndex].memories) {
    return;
  }
  
  let memory = yearDataForWeek[yearWeekInfo.weekIndex].memories.find(m => m.id === memoryId);
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
    // Get the week's date range (Monday to Sunday) for the correct year
    let weekRange = getWeekDateRange(yearWeekInfo.weekIndex, yearWeekInfo.year);
    
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
    textInput.setSelectionRange(textInput.value.length, textInput.value.length);
  }
}

/**
 * escapeHtml()
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text) {
  let div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
