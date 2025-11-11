/**
 * GoalCountdown.js
 * Handles the display of countdown timers for future goals
 */

class GoalCountdown {
  constructor() {
    this.goals = []; // Array of { text, weeksUntil, daysUntil, weekDate }
  }

  /**
   * update()
   * Updates the list of future goals and calculates countdowns
   * @param {Date} birthDate - User's birth date
   * @param {number} currentDisplayYear - Currently displayed year
   * @param {number} currentWeekIndex - Current week index (0-51)
   */
  update(birthDate, currentDisplayYear, currentWeekIndex) {
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
          
          this.goals.push({
            text: memory.text,
            weeksUntil: diffWeeks + 1,
            daysUntil: diffDays,
            weekDate: weekStart,
            goalDate: goalDate
          });
        }
      }
    }
    
    // Sort goals by date (soonest first)
    this.goals.sort((a, b) => a.weekDate.getTime() - b.weekDate.getTime());
    
    // Limit to first 5 goals to avoid clutter
    this.goals = this.goals.slice(0, 5);
    
    // Debug: log goals found
    if (this.goals.length > 0) {
      console.log(`Found ${this.goals.length} future goal(s):`, this.goals.map(g => g.text));
    }
  }

  /**
   * display()
   * Displays the goal countdowns in the bottom left corner
   */
  display() {
    if (this.goals.length === 0) {
      return;
    }

    push();
    noStroke();
    textAlign(LEFT, BOTTOM);
    
    // Position at bottom left with padding
    // Increased bottom padding to move goals up from the very bottom
    let padding = 20;
    let bottomPadding = windowWidth < 600 ? 30 : windowWidth < 900 ? 40 : 50; // More space from bottom
    let startX = padding;
    let startY = height - bottomPadding;
    
    // Responsive text sizes
    let fontSize = windowWidth < 600 ? 12 : windowWidth < 900 ? 14 : 16;
    let countdownFontSize = windowWidth < 600 ? 9 : windowWidth < 900 ? 11 : 13; // Dynamic countdown size
    let lineHeight = fontSize * 1.4;
    let countdownSpacing = fontSize * 0.2; // Closer spacing between goal and its own countdown
    let goalBlockSpacing = fontSize * 1.2; // Spacing between goal blocks (spread them out)
    
    // Background for better readability
    // No background rectangle (keep the area transparent)
    noFill();
    let bgWidth = windowWidth < 600 ? width - 40 : 400;
    // Each goal block: goal text height + countdown spacing + countdown height + spacing to next goal
    let goalBlockHeight = fontSize + countdownSpacing + countdownFontSize; // Height of one goal+countdown pair
    let goalSpacing = goalBlockHeight + goalBlockSpacing; // Total spacing between goal blocks
    let bgHeight = (this.goals.length * goalBlockHeight) + ((this.goals.length - 1) * goalBlockSpacing) + (padding * 2);
    // rect removed intentionally to avoid background
    
    // Text color
    fill("#525349");
    textSize(fontSize);
    
    // Display each goal (from bottom to top)
    for (let i = 0; i < this.goals.length; i++) {
      let goal = this.goals[i];
      // Calculate Y position from bottom
      let goalIndex = this.goals.length - i - 1; // Reverse order (last goal at bottom)
      // Calculate position: each goal block has its own height, plus spacing between blocks
      // Bottom of countdown for this goal block
      let yPos = startY - (goalIndex * (goalBlockHeight + goalBlockSpacing));
      
      // Format: "X week left (x days left)"
      let weekText = goal.weeksUntil === 1 ? 'week' : 'weeks';
      let dayText = goal.daysUntil === 1 ? 'day' : 'days';
      let goalText = `${goal.weeksUntil} ${weekText} left (${goal.daysUntil} ${dayText} left)`;
      
      // Truncate goal text if too long
      let maxTextLength = windowWidth < 600 ? 30 : 50;
      let displayText = goal.text.length > maxTextLength 
        ? goal.text.substring(0, maxTextLength) + '...' 
        : goal.text;
      
      // Position goal text first (at top of this goal block)
      // Goal text bottom is positioned above the countdown
      textSize(fontSize);
      fill("#525349");
      let goalTextY = yPos - countdownFontSize - countdownSpacing;
      text(displayText, startX, goalTextY);
      
      // Position countdown below its own goal text (closer to the goal above it)
      // Countdown bottom is at yPos
      push();
      noStroke();
      textSize(countdownFontSize); // Dynamic size
      fill(150);
      textStyle(ITALIC);
      text(goalText, startX, yPos);
      pop();
    }
    
    pop();
  }
}

