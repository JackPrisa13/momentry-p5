/**
 * ModalManager.js
 * Handles all modal dialog and memory management functionality
 * Encapsulates modal state and functionality in a class structure
 */

/**
 * ModalManager Class
 * Encapsulates all modal state and functionality
 */
class ModalManager {
  constructor() {
    // Modal state
    this.selectedWeeksSinceBirth = null; // Weeks since birth for the selected week (universal identifier)
    this.editingMemoryId = null;         // ID of memory being edited, null if adding new
    
    // Image data (base64 data URLs)
    this.modalImageDataURL = null;     // For image edit section
    this.modalImageDataURLNew = null;  // For new memory input section
    
    // Reference to birthDate (set via setBirthDate method)
    this.birthDate = null;
    
    // Reference to refreshCircleData callback (set via setRefreshCallback)
    this.refreshCircleDataCallback = null;
  }
  
  /**
   * setBirthDate()
   * Sets the birth date reference
   * @param {Date} birthDate - The user's birth date
   */
  setBirthDate(birthDate) {
    this.birthDate = birthDate;
  }
  
  /**
   * setRefreshCallback()
   * Sets the callback function for refreshing circle data
   * @param {Function} callback - Function to call when data needs to be refreshed
   */
  setRefreshCallback(callback) {
    this.refreshCircleDataCallback = callback;
  }
  
  // Helper methods for date formatting (static utility methods)
  static formatDateForDisplay(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  static formatDateForView(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * setupListeners()
   * Sets up event listeners for the modal Save and Cancel buttons
   */
  setupListeners() {
    // Cancel button
    let cancelBtn = document.getElementById('modal-cancel-btn');
    cancelBtn.addEventListener('click', function() {
      // If editing, return to view mode; otherwise close modal
      if (this.editingMemoryId !== null && this.selectedWeeksSinceBirth !== null) {
        // Get the memory to restore its date before clearing
        let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(this.selectedWeeksSinceBirth, this.birthDate);
        let memoryDate = null;
        if (yearWeekInfo) {
          let yearDataForWeek = loadData(yearWeekInfo.year);
          if (yearDataForWeek && yearDataForWeek[yearWeekInfo.weekIndex].memories) {
            let memory = yearDataForWeek[yearWeekInfo.weekIndex].memories.find(m => m.id === this.editingMemoryId);
            if (memory) {
              memoryDate = memory.date;
            }
          }
        }
        
        // Reset form fields using shared helper
        resetFormToInitialState({ resetDate: false, resetButtons: false, clearImageData: true });
        this.modalImageDataURL = undefined; // Explicitly set to undefined for editing
        
        // Restore the memory's date to avoid invalid date state
        const dateInput = document.getElementById('memory-date-input');
        if (dateInput && memoryDate) {
          dateInput.value = memoryDate;
        }
        
        // Return to view mode showing the memory being edited
        viewMemory(this.selectedWeeksSinceBirth, this.editingMemoryId);
      } else {
        // Not editing, just close the modal
        hideModal();
      }
    }.bind(this));
    
    // Image input handlers (for image edit section)
    const imageInput = document.getElementById('memory-image-input');
    const imagePreview = document.getElementById('memory-image-preview');
    const imageClearBtn = document.getElementById('memory-image-clear-btn');
    setupImageInputHandler(imageInput, imagePreview, imageClearBtn, 'modalImageDataURL');

    // Image input handlers (for input section - used for both new and editing)
    const imageInputNew = document.getElementById('memory-image-input-new');
    const imagePreviewNew = document.getElementById('memory-image-preview-new');
    const imageClearBtnNew = document.getElementById('memory-image-clear-btn-new');
    setupImageInputHandler(imageInputNew, imagePreviewNew, imageClearBtnNew, 'modalImageDataURLNew');

    // View memory close button
    let closeViewBtn = document.getElementById('memory-close-view-btn');
    if (closeViewBtn) {
      closeViewBtn.addEventListener('click', function() {
        // Return to list view with all memories
        showMemoryInputSection(false); // Show list when closing view
        this.editingMemoryId = null;
        // Refresh the memories list to show updated data
        if (this.selectedWeeksSinceBirth !== null) {
          displayMemoriesList(this.selectedWeeksSinceBirth);
        }
      }.bind(this));
    }

    // Edit content button (title, text, date)
    let editContentBtn = document.getElementById('memory-edit-content-btn');
    if (editContentBtn) {
      editContentBtn.addEventListener('click', function() {
        if (this.editingMemoryId !== null && this.selectedWeeksSinceBirth !== null) {
          startEditingMemory(this.selectedWeeksSinceBirth, this.editingMemoryId);
        }
      }.bind(this));
    }

    // Delete memory button
    let deleteBtn = document.getElementById('memory-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        if (this.editingMemoryId !== null && this.selectedWeeksSinceBirth !== null) {
          deleteMemory(this.selectedWeeksSinceBirth, this.editingMemoryId);
          // Clear editing state
          this.editingMemoryId = null;
          // Return to list view after deletion
          showMemoryInputSection(false);
        }
      }.bind(this));
    }

    // Save button
    let saveBtn = document.getElementById('modal-save-btn');
    saveBtn.addEventListener('click', function() {
      if (this.selectedWeeksSinceBirth !== null && this.birthDate) {
        let titleInput = document.getElementById('memory-title-input');
        let textInput = document.getElementById('modal-text-input');
        let dateInput = document.getElementById('memory-date-input');
        let title = titleInput ? titleInput.value.trim() : '';
        let text = textInput.value.trim();
        let date = dateInput.value;
        
        if (!title) {
          alert('Please enter a title.');
          return;
        }
        
        if (!text) {
          alert('Please enter a memory or goal.');
          return;
        }
        
        if (!date) {
          alert('Please select a date.');
          return;
        }
        
        // Convert weeks since birth to year and week index
        let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(this.selectedWeeksSinceBirth, this.birthDate);
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
        
        if (this.editingMemoryId !== null) {
          // Editing existing memory (title, text, date, and image)
          // modalImageDataURL is set when user selects/changes image during edit
          let savedMemoryId = this.editingMemoryId; // Store ID before clearing
          editMemory(this.selectedWeeksSinceBirth, this.editingMemoryId, title, text, date, this.modalImageDataURL);
          
          // Clear editing state
          this.editingMemoryId = null;
          this.modalImageDataURL = null; // Clear image data after saving
          
          // Clear form and reset to initial state
          resetFormToInitialState({ resetDate: true, resetButtons: true, clearImageData: true });
          
          // Return to view mode showing the edited memory
          viewMemory(this.selectedWeeksSinceBirth, savedMemoryId);
        } else {
          // Adding new memory (with optional image)
          addMemory(this.selectedWeeksSinceBirth, title, text, date, this.modalImageDataURLNew);
          // Keep modal open, just refresh list and clear form
          displayMemoriesList(this.selectedWeeksSinceBirth);
          
          // Reset form to initial state
          resetFormToInitialState({ resetDate: true, resetButtons: false, clearImageData: true });
          
          // Focus on text input for next entry
          const textInput = document.getElementById('modal-text-input');
          if (textInput) textInput.focus();
        }
      }
    }.bind(this));
    
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
}

// Global modal manager instance
let modalManager = new ModalManager();

// Utility functions (static helpers that don't need instance state)
/**
 * formatDateForDisplay()
 * Formats a date string for display in the memory list (short format)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
function formatDateForDisplay(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * formatDateForView()
 * Formats a date string for display in the memory view (long format)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
function formatDateForView(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * resizeImage()
 * Resizes an image to a maximum dimension while maintaining aspect ratio
 * @param {string} dataURL - Base64 image data URL
 * @param {number} maxDimension - Maximum width or height in pixels (default: 1080)
 * @returns {Promise<string>} - Resized image as base64 data URL
 */
function resizeImage(dataURL, maxDimension = 1080) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      // If image is smaller than max, return original
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataURL);
        return;
      }
      
      // Calculate scaling factor
      let scale = Math.min(maxDimension / width, maxDimension / height);
      let newWidth = Math.round(width * scale);
      let newHeight = Math.round(height * scale);
      
      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      
      // Use high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to data URL (use JPEG for smaller file size, quality 0.9)
      const resizedDataURL = canvas.toDataURL('image/jpeg', 0.9);
      resolve(resizedDataURL);
    };
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    img.src = dataURL;
  });
}

/**
 * setupImageInputHandler()
 * Sets up event listeners for an image input element
 * @param {HTMLElement} imageInput - The file input element
 * @param {HTMLElement} imagePreview - The preview image element
 * @param {HTMLElement} imageClearBtn - The clear button element
 * @param {string} dataURLVar - Variable name to store the data URL ('modalImageDataURL' or 'modalImageDataURLNew')
 */
function setupImageInputHandler(imageInput, imagePreview, imageClearBtn, dataURLVar) {
  if (!imageInput) return;
  
  imageInput.addEventListener('change', function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }
    
    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image file is too large. Maximum size is 10MB. Please choose a smaller image.');
      imageInput.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      // Resize image to max 1080px on longest side
      resizeImage(evt.target.result, 1080)
        .then(function(resizedDataURL) {
          // Store in appropriate variable using modalManager instance
          if (dataURLVar === 'modalImageDataURL') {
            modalManager.modalImageDataURL = resizedDataURL;
          } else if (dataURLVar === 'modalImageDataURLNew') {
            if (modalManager.editingMemoryId !== null) {
              modalManager.modalImageDataURL = resizedDataURL;    // For editing
            } else {
              modalManager.modalImageDataURLNew = resizedDataURL; // For new memory
            }
          }
          
          if (imagePreview) {
            imagePreview.src = resizedDataURL;
            imagePreview.style.display = 'block';
          }
          if (imageClearBtn) {
            imageClearBtn.style.display = 'inline-block';
          }
        })
        .catch(function(error) {
          console.error('Error resizing image:', error);
          alert('Error processing image. Please try again.');
          imageInput.value = '';
        });
    };
    reader.onerror = function() {
      alert('Error reading image file. Please try again.');
      imageInput.value = '';
    };
    reader.readAsDataURL(file);
  });
  
  if (imageClearBtn) {
    imageClearBtn.addEventListener('click', function() {
      if (dataURLVar === 'modalImageDataURL') {
        modalManager.modalImageDataURL = null;
      } else if (dataURLVar === 'modalImageDataURLNew') {
        if (modalManager.editingMemoryId !== null) {
          modalManager.modalImageDataURL = null;     // null means "remove image" when editing
        } else {
          modalManager.modalImageDataURLNew = null;  // For new memory
        }
      }
      
      clearImagePreviewControls(imagePreview, imageInput, imageClearBtn);
    });
  }
}

/**
 * clearImagePreviewControls()
 * Helper to hide preview, reset input value, and hide clear button
 */
function clearImagePreviewControls(imagePreview, imageInput, imageClearBtn) {
  if (imagePreview) {
    imagePreview.removeAttribute('src');
    imagePreview.style.display = 'none';
  }
  if (imageInput) {
    imageInput.value = '';
  }
  if (imageClearBtn) {
    imageClearBtn.style.display = 'none';
  }
}

/**
 * resetFormToInitialState()
 * Resets all form fields to their initial state
 * @param {Object} options - Configuration options
 * @param {boolean} options.resetDate - If true, reset date to default within week range
 * @param {boolean} options.resetButtons - If true, reset button texts to "Add" and "Close"
 * @param {boolean} options.clearImageData - If true, clear image data variables
 */
function resetFormToInitialState(options = {}) {
  const {
    resetDate = false,
    resetButtons = false,
    clearImageData = true
  } = options;
  
  // Clear form inputs
  const titleInput = document.getElementById('memory-title-input');
  const textInput = document.getElementById('modal-text-input');
  const dateInput = document.getElementById('memory-date-input');
  
  if (titleInput) titleInput.value = '';
  if (textInput) textInput.value = '';
  
  // Reset date if requested
  if (resetDate && dateInput && modalManager.selectedWeeksSinceBirth !== null && modalManager.birthDate) {
    let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(modalManager.selectedWeeksSinceBirth, modalManager.birthDate);
    if (yearWeekInfo) {
      let weekRange = getWeekDateRange(yearWeekInfo.weekIndex, yearWeekInfo.year);
      // Always use the first day of the week (Monday) as default
      let defaultDate = weekRange.startDate;
      dateInput.value = formatDateForInput(defaultDate);
    }
  } else if (dateInput) {
    dateInput.value = '';
  }
  
  // Clear image preview and inputs
  const imagePreviewNew = document.getElementById('memory-image-preview-new');
  const imageInputNew = document.getElementById('memory-image-input-new');
  const imageClearBtnNew = document.getElementById('memory-image-clear-btn-new');
  
  clearImagePreviewControls(imagePreviewNew, imageInputNew, imageClearBtnNew);
  
  // Clear image data variables if requested
  if (clearImageData) {
    modalManager.modalImageDataURL = null;
    modalManager.modalImageDataURLNew = null;
  }
  
  // Reset button texts if requested
  if (resetButtons) {
    const saveBtn = document.getElementById('modal-save-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (saveBtn) saveBtn.textContent = 'Add';
    if (cancelBtn) cancelBtn.textContent = 'Close';
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
  
  // Reset form to initial state
  resetFormToInitialState({ resetDate: false, resetButtons: true, clearImageData: true });
  
  // Also clear the old image edit section controls (if they exist)
  const imageInput = document.getElementById('memory-image-input');
  const imagePreview = document.getElementById('memory-image-preview');
  const imageClearBtn = document.getElementById('memory-image-clear-btn');
  
  clearImagePreviewControls(imagePreview, imageInput, imageClearBtn);

  // Show input section, hide view and image edit sections
  showMemoryInputSection(false);
  
  modalManager.selectedWeeksSinceBirth = null;
  modalManager.editingMemoryId = null;
}

/**
 * getYearDataForWeek()
 * Helper function to get year data for a week
 * @param {number} weeksSinceBirth - Weeks since birth
 * @returns {Object|null} - { yearData, yearWeekInfo } or null if error
 */
function getYearDataForWeek(weeksSinceBirth) {
  if (!modalManager.birthDate) {
    console.error('Cannot access memory: birthDate not set');
    return null;
  }
  
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, modalManager.birthDate);
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
  
  // Use the callback from modalManager if available
  if (modalManager.refreshCircleDataCallback) {
    modalManager.refreshCircleDataCallback(year);
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
 * @param {string} title - The memory title
 * @param {string} text - The memory text
 * @param {string} date - The memory date (YYYY-MM-DD)
 * @param {string|null} imageDataURL - Optional image data URL
 */
function addMemory(weeksSinceBirth, title, text, date, imageDataURL) {
  let result = getYearDataForWeek(weeksSinceBirth);
  if (!result) return;
  
  let { yearData, yearWeekInfo } = result;
  
  if (!yearData[yearWeekInfo.weekIndex].memories) {
    yearData[yearWeekInfo.weekIndex].memories = [];
  }
  
  let newMemory = {
    id: generateMemoryId(),
    title: title,
    text: text,
    date: date,
    timestamp: new Date().toISOString(),
    imageData: imageDataURL || null
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
 * @param {string|null} title - The memory title (null to skip update)
 * @param {string|null} text - The memory text (null to skip update)
 * @param {string|null} date - The memory date (null to skip update)
 * @param {string|null|undefined} imageDataURL - Image data URL (undefined to skip, null to clear)
 */
function editMemory(weeksSinceBirth, memoryId, title, text, date, imageDataURL) {
  let result = getYearDataForWeek(weeksSinceBirth);
  if (!result) return;
  
  let { yearData, yearWeekInfo } = result;
  
  if (!yearData[yearWeekInfo.weekIndex].memories) {
    return;
  }
  
  let memory = yearData[yearWeekInfo.weekIndex].memories.find(m => m.id === memoryId);
  if (!memory) return;
  
  // Only update fields that are provided (not null)
  if (title !== null && title !== undefined) {
    memory.title = title;
  }
  if (text !== null && text !== undefined) {
    memory.text = text;
  }
  if (date !== null && date !== undefined) {
    memory.date = date;
  }
  // Only update image if argument is explicitly provided (undefined = skip, null = clear)
  if (imageDataURL !== undefined) {
    memory.imageData = imageDataURL;
  }
  
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
  
  if (!modalManager.birthDate) {
    console.error('Cannot display memories: birthDate not set');
    return;
  }
  
  // Convert weeks since birth to year and week index
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, modalManager.birthDate);
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
  
  // Memories are already sorted by date when added/edited, so use them directly
  yearDataForWeek[yearWeekInfo.weekIndex].memories.forEach(memory => {
    let memoryItem = document.createElement('div');
    memoryItem.className = 'memory-item';
    memoryItem.style.cursor = 'pointer';
    
    // Format date for display
    let displayDate = formatDateForDisplay(memory.date);
    
    // Get title (fallback to first part of text if no title)
    let displayTitle = memory.title || (memory.text ? memory.text.substring(0, 50) + (memory.text.length > 50 ? '...' : '') : 'Untitled');
    
    memoryItem.innerHTML = `
      <div class="memory-item-header">
        <span class="memory-item-title" style="font-weight: bold; font-size: 1.1em;">${escapeHtml(displayTitle)}</span>
        <span class="memory-item-date">${displayDate}</span>
      </div>
    `;
    
    // Entire item is clickable to view memory
    memoryItem.addEventListener('click', function() {
      viewMemory(weeksSinceBirth, memory.id);
    });
    
    memoriesList.appendChild(memoryItem);
  });
}

/**
 * viewMemory()
 * Displays a memory in view mode
 * @param {number} weeksSinceBirth - The weeks since birth for this week
 * @param {string} memoryId - The ID of the memory to view
 */
function viewMemory(weeksSinceBirth, memoryId) {
  if (!modalManager.birthDate) {
    console.error('Cannot view memory: birthDate not set');
    return;
  }
  
  // Convert weeks since birth to year and week index
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, modalManager.birthDate);
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
  
  // Set editingMemoryId so we can edit the image later
  modalManager.editingMemoryId = memoryId;
  
  // Hide input section and memories list, show view section
  let inputSection = document.getElementById('memory-input-section');
  let viewSection = document.getElementById('memory-view-section');
  let imageEditSection = document.getElementById('image-edit-section');
  let memoriesListContainer = document.getElementById('memories-list-container');
  
  if (inputSection) inputSection.style.display = 'none';
  if (imageEditSection) imageEditSection.style.display = 'none';
  if (memoriesListContainer) memoriesListContainer.style.display = 'none'; // Hide the list when viewing
  if (viewSection) {
    viewSection.style.display = 'block';
    
    // Populate view with memory data
    let viewTitle = document.getElementById('memory-view-title');
    let viewDate = document.getElementById('memory-view-date');
    let viewText = document.getElementById('memory-view-text');
    let viewImageWrapper = document.getElementById('memory-view-image-wrapper');
    let viewImage = document.getElementById('memory-view-image');
    
    if (viewTitle) {
      viewTitle.textContent = memory.title || 'Untitled';
    }
    
    if (viewDate) {
      let displayDate = formatDateForView(memory.date);
      viewDate.textContent = displayDate;
    }
    
    if (viewText) {
      viewText.textContent = memory.text || '';
    }
    
    // Show image if it exists
    if (memory.imageData && viewImage && viewImageWrapper) {
      viewImage.src = memory.imageData;
      viewImageWrapper.style.display = 'flex'; // Use flex to center the image
    } else if (viewImageWrapper) {
      viewImageWrapper.style.display = 'none';
    }
  }
}

/**
 * showMemoryInputSection()
 * Shows the input section and hides view/image edit sections
 * @param {boolean} hideList - If true, hide the memories list (e.g., when editing)
 */
function showMemoryInputSection(hideList) {
  let inputSection = document.getElementById('memory-input-section');
  let viewSection = document.getElementById('memory-view-section');
  let imageEditSection = document.getElementById('image-edit-section');
  let memoriesListContainer = document.getElementById('memories-list-container');
  
  if (inputSection) inputSection.style.display = 'block';
  if (viewSection) viewSection.style.display = 'none';
  if (imageEditSection) imageEditSection.style.display = 'none';
  // Hide list when editing, show when adding new
  if (memoriesListContainer) {
    memoriesListContainer.style.display = hideList ? 'none' : 'block';
  }
}

/**
 * startEditingMemory()
 * Loads a memory into the edit form
 * @param {number} weeksSinceBirth - The weeks since birth for this week (universal identifier)
 * @param {string} memoryId - The ID of the memory to edit
 */
function startEditingMemory(weeksSinceBirth, memoryId) {
  if (!modalManager.birthDate) {
    console.error('Cannot start editing memory: birthDate not set');
    return;
  }
  
  // Convert weeks since birth to year and week index
  let yearWeekInfo = getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, modalManager.birthDate);
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
  
  modalManager.editingMemoryId = memoryId;
  
  // Update save button text to "Save" when editing
  let saveBtn = document.getElementById('modal-save-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Save';
  }
  
  // Update cancel button text to "Cancel" when editing
  let cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.textContent = 'Cancel';
  }
  
  let titleInput = document.getElementById('memory-title-input');
  let textInput = document.getElementById('modal-text-input');
  let dateInput = document.getElementById('memory-date-input');
  
  if (titleInput) {
    titleInput.value = memory.title || '';
  }
  
  if (textInput) {
    textInput.value = memory.text || '';
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
  
  // Load current image into preview if it exists
  const imagePreviewNew = document.getElementById('memory-image-preview-new');
  const imageInputNew = document.getElementById('memory-image-input-new');
  const imageClearBtnNew = document.getElementById('memory-image-clear-btn-new');
  
  // Reset modalImageDataURL to null initially (user can change it by selecting a new image)
  modalManager.modalImageDataURL = undefined; // undefined means "don't change", null means "remove"
  
  if (memory.imageData && imagePreviewNew) {
    // Show existing image in preview
    imagePreviewNew.src = memory.imageData;
    imagePreviewNew.style.display = 'block';
    if (imageClearBtnNew) {
      imageClearBtnNew.style.display = 'inline-block';
    }
  } else {
    // No existing image, clear preview
    clearImagePreviewControls(imagePreviewNew, imageInputNew, imageClearBtnNew);
  }
  
  // Show input section and hide view section (hide list when editing)
  showMemoryInputSection(true);
  
  // Scroll to input section
  let inputSection = document.getElementById('memory-input-section');
  if (inputSection) {
    inputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (titleInput) {
      titleInput.focus();
      titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    } else if (textInput) {
      textInput.focus();
      textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }
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