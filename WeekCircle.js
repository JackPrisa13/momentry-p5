class WeekCircle {
    /**
     * @param {number} x - The x-coordinate of the circle's center.
     * @param {number} y - The y-coordinate of the circle's center.
     * @param {number} id - The week number (0-51).
     * @param {object} data - A reference to the data object for this week (e.g., yearData[id]).
     */
    constructor(x, y, size, id, weeksSinceBirth, data) {
      // --- Core Properties ---
        this.x = x;
        this.y = y;
        this.id = id;
        this.weeksSinceBirth = weeksSinceBirth;
        this.data = data; // A *reference* to the data in sketch.js
        this.emptyColour = "#F5F4E3";
        this.emptyColourPast = "#BFC0B1";
        this.filledColourMemory = "#525349";
        this.filledColourGoal = "#F4CD7F";
        this.currentWeekColour = "#68D58B";
        this.borderColour = "#0B0D07B3";
    
        // --- State & Animation ---
        this.isHovered = false;
        this.baseSize = size; // The normal size of the circle
        this.targetSize = this.baseSize;
        this.currentSize = this.baseSize;
        this.lerpSpeed = 0.1; // Animation speed (0.1 is smooth)
    }

    /**
     * checkHover()
     * Detects if the mouse is over this circle.
     * This should be called from sketch.js's main draw() loop *before* display().
     * @returns {boolean} - True if the mouse is over, false otherwise.
     */
    checkHover() {
        let d = dist(mouseX, mouseY, this.x, this.y);
        let wasHovered = this.isHovered;
        
        // Check if distance is less than *half* the size (the radius)
        if (d < this.baseSize / 2) {
            this.isHovered = true;
            // Play sound when entering hover state
            if (!wasHovered) {
                playTick();
            }
        } else {
            this.isHovered = false;
        }
        return this.isHovered;
    }

    /**
     * update()
     * This handles the smooth animation logic for size.
     * It's called internally by display() every frame.
     */
    update() {
      // Set the target size based on hover state
        if (this.isHovered) {
            this.targetSize = this.baseSize * 1.25; // 30% zoom
        } else {
            this.targetSize = this.baseSize;
        }
    
        // Smoothly animate the current size towards the target size
        this.currentSize = lerp(this.currentSize, this.targetSize, this.lerpSpeed);
    }

    /**
     * display()
     * This draws the circle to the canvas,
     * reading from its data to determine its color.
     */
    display(currentWeekIndex) {
      // First, update the size animation
        this.update();
        strokeWeight(2);
        
        // Check if week has memories (new format) or memory (old format for migration)
        let hasData = (this.data && (
            (this.data.memories && this.data.memories.length > 0) ||
            (this.data.memory && this.data.memory.length > 0)
        ));
        let isPast = (this.id < currentWeekIndex);
        let isCurrent = (this.id === currentWeekIndex);

        // Rule 1: Set fill colour based on data and time
        if (hasData) {
            if (isPast) {
                // Data in the past = Memory
                fill(this.filledColourMemory);
            } else if (isCurrent) {
                // Data in current week = Memory (same as past)
                fill(this.filledColourMemory);
            } else {
                // Data in the future = Goal
                fill(this.filledColourGoal);
            }
        } else {
            // No data - different colors for past, current, and future
            if (isPast) {
                // Empty past weeks = lighter color
                fill(this.emptyColourPast);
            } else {
                // Empty future weeks = original empty color
                fill(color(this.emptyColour + "66")); // Add opacity (hex '66' = 40% alpha)
            }
        }
        
        // Rule 2: Highlight the current week
        if (isCurrent) {
            stroke(this.currentWeekColour);
            strokeWeight(6);
        } else {
            stroke(this.borderColour);
            strokeWeight(2);
        }
    
        // Draw the circle
        circle(this.x, this.y, this.currentSize);
        
        // Draw week number text
        this.drawWeekNumber(currentWeekIndex);
    }
    
    /**
     * drawWeekNumber()
     * Draws the week number text on hover or for current week
     * @param {number} currentWeekIndex - The current week index
     */
    drawWeekNumber(currentWeekIndex) {
        // Show week number on hover OR if it's the current week
        if (this.isHovered || this.id === currentWeekIndex) {
            push();
            noStroke();
            
            // Check if current week has data (memories array or old memory string)
            let hasData = (this.data && (
                (this.data.memories && this.data.memories.length > 0) ||
                (this.data.memory && this.data.memory.length > 0)
            ));
            let isCurrent = (this.id === currentWeekIndex);
            
            // Set text properties based on week type and data
            if (this.id > currentWeekIndex) {
                // Future weeks - always dark
                fill(this.filledColourMemory);
            } else if (isCurrent) {
                // Current week - dark if empty, light if filled
                fill(hasData ? this.emptyColour : this.filledColourMemory);
            } else {
                // Past weeks - always light
                fill(this.emptyColour);
            }
            
            textAlign(LEFT, TOP);
            // Responsive text size for week number
            let weekNumSize = windowWidth < 600 ? 8 : windowWidth < 900 ? 10 : 12;
            textSize(weekNumSize);
            textStyle(ITALIC);
            // Responsive offset based on circle size
            let offsetX = this.baseSize * 0.15;
            let offsetY = this.baseSize * 0.20;
            text(this.id + 1, this.x - this.baseSize / 2 + offsetX, this.y - this.baseSize / 2 + offsetY);
    
            // Weeks since birth (center, larger) - same color logic
            if (this.id > currentWeekIndex) {
                fill(this.filledColourMemory);
            } else if (isCurrent) {
                fill(hasData ? this.emptyColour : this.filledColourMemory);
            } else {
                fill(this.emptyColour);
            }
            
            textAlign(CENTER, CENTER);
            // Responsive text size for weeks since birth
            let weeksSize = windowWidth < 600 ? 15 : windowWidth < 900 ? 20 : 25;
            textSize(weeksSize);
            text(this.weeksSinceBirth.toLocaleString(), this.x, this.y);
            
            pop();
        }
    }
}