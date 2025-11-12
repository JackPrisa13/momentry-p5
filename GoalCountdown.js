/**
 * GoalCountdown.js
 * Handles the display of countdown timers for future goals
 */

class GoalCountdown {
  constructor() {
    this.goals = []; // Array of { title, weeksUntil, daysUntil, weekDate, goalDate }
  }

  /**
   * update()
   * Updates the list of future goals and calculates countdowns
   * @param {Date} birthDate - User's birth date
   * @param {number} currentDisplayYear - Currently displayed year
   * @param {number} currentWeekIndex - Current week index (0-51)
   */
  update(birthDate, currentDisplayYear, currentWeekIndex) {
    this.birthDate = birthDate; // Store for click detection
    if (!birthDate) {
      this.goals = [];
      return;
    }

    this.goals = [];
    let today = new Date();
    let currentYear = today.getFullYear();
    
    // Check current year and future years for goals
    // We'll check up to 5 years in the future to keep it reasonable
    let maxFutureYear = currentYear + 5;
    
    for (let year = currentYear; year <= maxFutureYear; year++) {
      let yearData = loadData(year);
      if (!yearData) continue;
      
      for (let weekIndex = 0; weekIndex < yearData.length; weekIndex++) {
        let weekData = yearData[weekIndex];
        if (!weekData || !weekData.memories || weekData.memories.length === 0) {
          continue;
        }
        
        // Get the week's date range
        let weekRange = getWeekDateRange(weekIndex, year);
        let weekMonday = weekRange.startDate;
        
        // Check if this week is in the future
        let weekStart = new Date(weekMonday);
        weekStart.setHours(0, 0, 0, 0);
        let todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        // Skip if this week is in the past or current week
        // We want to show goals that are in the future (weekStart > todayStart)
        if (weekStart <= todayStart) {
          continue;
        }
        
        // This is a future week with goals - add each memory as a goal
        for (let memory of weekData.memories) {
          // Calculate time until this week
          let diffTime = weekStart.getTime() - todayStart.getTime();
          let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          let diffWeeks = Math.floor(diffDays / 7);
          
          // Use the memory's date if available, otherwise use the week's Monday
          let goalDate = memory.date ? new Date(memory.date) : weekStart;
          
          // Calculate weeks since birth for this goal (needed for opening the memory)
          let weeksSinceBirth = getWeeksSinceBirth(weekIndex, year, birthDate);
          
          this.goals.push({
            title: memory.title || memory.text || 'Untitled', // Use title, fallback to text, then "Untitled"
            memoryId: memory.id, // Store memory ID for opening
            weeksSinceBirth: weeksSinceBirth, // Store weeks since birth for opening
            weeksUntil: diffWeeks + 1,
            daysUntil: diffDays,
            weekDate: weekStart,
            goalDate: goalDate,
            // Store card bounds for click detection
            cardBounds: null // Will be calculated in display()
          });
        }
      }
    }
    
    // Sort goals by date (soonest first)
    this.goals.sort((a, b) => a.weekDate.getTime() - b.weekDate.getTime());
    
    // Limit to first 5 goals to help focus (concept: focus on 5 at a time)
    this.goals = this.goals.slice(0, 5);
    
    // Debug logging removed to avoid console spam each frame
  }

  /**
   * display()
   * Displays the goal countdowns as clickable cards in the bottom left corner
   */
  display() {
    if (this.goals.length === 0) {
      return;
    }

    push();
    textAlign(LEFT, BOTTOM);
    
    // Position at bottom left with padding
    let padding = 20;
    let bottomPadding = windowWidth < 600 ? 30 : windowWidth < 900 ? 40 : 50;
    let startX = padding;
    let startY = height - bottomPadding;
    
    // Responsive text sizes
    let fontSize = windowWidth < 600 ? 12 : windowWidth < 900 ? 14 : 16;
    let countdownFontSize = windowWidth < 600 ? 9 : windowWidth < 900 ? 11 : 13;
    let titleFontSize = windowWidth < 600 ? 14 : windowWidth < 900 ? 16 : 18;
    let countdownSpacing = fontSize * 0.2;
    let goalBlockSpacing = fontSize * 0.6; // Reduced spacing between cards
    let titleSpacing = fontSize * 0.8; // Spacing between title and first card
    
    // Card dimensions
    let cardWidth = windowWidth < 600 ? width - 60 : 280; // Reduced width
    let cardPadding = 12;
    let goalBlockHeight = fontSize + countdownSpacing + countdownFontSize + (cardPadding * 2);
    
    // Calculate total height of all goal cards
    let totalCardsHeight = (this.goals.length * goalBlockHeight) + ((this.goals.length - 1) * goalBlockSpacing);
    
    // Draw title "On the horizon" above the cards
    push();
    noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(titleFontSize);
    fill("#525349");
    textStyle(BOLD);
    let titleY = startY - totalCardsHeight - titleSpacing;
    text("On the horizon", startX, titleY);
    pop();
    
    // Display all goals as cards (from bottom to top)
    for (let i = 0; i < this.goals.length; i++) {
      let goal = this.goals[i];
      let goalIndex = this.goals.length - i - 1; // Reverse order (last goal at bottom)
      let yPos = startY - (goalIndex * (goalBlockHeight + goalBlockSpacing));
      
      // Calculate card bounds for click detection
      let cardX = startX;
      let cardY = yPos - goalBlockHeight;
      let cardHeight = goalBlockHeight;
      
      // Store card bounds for click detection
      let bounds = {
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight
      };
      goal.cardBounds = bounds;
      
      // Check if mouse is hovering over this card
      let isHovered = mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
                      mouseY >= bounds.y && mouseY <= bounds.y + bounds.height;
      
      // Draw card background
      push();
      noStroke();
      if (isHovered) {
        fill(245, 244, 227, 240); // Slightly darker on hover
      } else {
        fill(245, 244, 227, 200); // Semi-transparent beige
      }
      rect(bounds.x, bounds.y, bounds.width, bounds.height, 8); // Rounded corners
      pop();
      
      // Draw card border
      push();
      stroke(isHovered ? "#68D58B" : "#BFC0B1");
      strokeWeight(isHovered ? 2 : 1);
      noFill();
      rect(bounds.x, bounds.y, bounds.width, bounds.height, 8);
      pop();
      
      // Format: "X week left (x days left)"
      let weekText = goal.weeksUntil === 1 ? 'week' : 'weeks';
      let dayText = goal.daysUntil === 1 ? 'day' : 'days';
      let goalText = `${goal.weeksUntil} ${weekText} left (${goal.daysUntil} ${dayText} left)`;
      
      // Truncate goal title if too long
      let maxTextLength = windowWidth < 600 ? 25 : 40;
      let displayText = goal.title.length > maxTextLength 
        ? goal.title.substring(0, maxTextLength) + '...' 
        : goal.title;
      
      // Position goal text (adjusted for card padding) - no stroke on text
      push();
      noStroke();
      textSize(fontSize);
      fill("#525349");
      let goalTextY = bounds.y + bounds.height - countdownFontSize - countdownSpacing - cardPadding;
      text(displayText, bounds.x + cardPadding, goalTextY);
      pop();
      
      // Position countdown below title - no stroke on text
      push();
      noStroke();
      textSize(countdownFontSize);
      fill(120);
      textStyle(ITALIC);
      text(goalText, bounds.x + cardPadding, bounds.y + bounds.height - cardPadding);
      pop();
    }
    
    pop();
  }
  
  /**
   * checkClick()
   * Checks if a goal card was clicked and returns the goal info
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {Object|null} - Goal object if clicked, null otherwise
   */
  checkClick(mouseX, mouseY) {
    // Check all goals for click detection
    for (let goal of this.goals) {
      if (goal.cardBounds) {
        let bounds = goal.cardBounds;
        if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
            mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
          return goal;
        }
      }
    }
    return null;
  }
}

