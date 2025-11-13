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
        this.data = data;                                           // A *reference* to the data in sketch.js
        this.emptyColour = "#F5F4E3";
        this.emptyColourPast = "#BFC0B1";
        this.filledColourMemory = "#525349";
        this.filledColourGoal = "#F4CD7F";
        this.currentWeekColour = "#ff914d";
        this.borderColour = "#0B0D07B3";
    
        // --- State & Animation ---
        this.isHovered = false;
        this.baseSize = size;                                       // The normal size of the circle
        this.targetSize = this.baseSize;
        this.currentSize = this.baseSize;
        this.lerpSpeed = 0.1;                                       // Animation speed (0.1 is smooth)
        this.visualOffsetY = 0;
        this.breathAmplitude = Math.min(6, this.baseSize * 0.08);
        this.breathSpeed = random(0.5, 0.9);
        this.breathPhase = random(TWO_PI);
        this.alpha = 255;                                           // Opacity for fade transitions (0-255)
        
        // --- Cached State (calculated once, not every frame) ---
        this.isBeforeBirth = false;
        this.isPast = false;
        this.weekRange = null;                                      // Cached week date range
        this.hasData = false;                                       // Cached data check
    }
    
    /**
     * checkHasData()
     * Checks if this week has any memories (cached for performance)
     * @returns {boolean} - True if week has data
     */
    checkHasData() {
        return (this.data && (
            (this.data.memories && this.data.memories.length > 0) ||
            (this.data.memory && this.data.memory.length > 0)
        ));
    }
    
    /**
     * updateState()
     * Calculates and caches state that doesn't change during a year view
     * This should be called once when the circle is created or when the year changes
     * @param {number} currentDisplayYear - The year currently being displayed
     * @param {Date} birthDate - The user's birth date
     * @param {Date} today - The current date (for isPast calculation)
     */
    updateState(currentDisplayYear, birthDate, today) {
        // Calculate week range ONCE
        this.weekRange = getWeekDateRange(this.id, currentDisplayYear);
        let weekMonday = this.weekRange.startDate;
        let weekMondayStart = new Date(weekMonday);
        weekMondayStart.setHours(0, 0, 0, 0);
        
        // Calculate isBeforeBirth ONCE
        if (birthDate) {
            let birthDateStart = new Date(birthDate);
            birthDateStart.setHours(0, 0, 0, 0);
            this.isBeforeBirth = weekMondayStart < birthDateStart;
        } else {
            this.isBeforeBirth = false;
        }
        
        // Calculate isPast ONCE
        let todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        this.isPast = weekMondayStart < todayStart;
        
        // Cache hasData check
        this.hasData = this.checkHasData();
    }

    /**
     * checkHover()
     * Detects if the mouse is over this circle.
     * This should be called from sketch.js's main draw() loop *before* display().
     * @returns {boolean} - True if the mouse is over, false otherwise.
     */
    checkHover() {
        // Weeks before birth are not interactive
        if (this.isBeforeBirth) {
            this.isHovered = false;
            return false;
        }
        
        let d = dist(mouseX, mouseY, this.x, this.y);
        let wasHovered = this.isHovered;
        
        // Check if distance is less than *half* the size (the radius)
        if (d < this.baseSize / 2) {
            this.isHovered = true;
            // Play sound when entering hover state
            if (!wasHovered) {
                audioManager.playTick();
            }
        } else {
            this.isHovered = false;
        }
        return this.isHovered;
    }

    /**
     * updateBreathing()
     * Updates the gentle vertical drift offset for the visual representation.
     * The core interaction coordinates remain fixed at (this.x, this.y).
     */
    updateBreathing() {
        const t = millis() * 0.001; // Convert to seconds for easier tuning
        this.visualOffsetY = sin(t * this.breathSpeed + this.breathPhase) * this.breathAmplitude;
    }

    /**
     * update()
     * This handles the smooth animation logic for size.
     * It's called internally by display() every frame.
     */
    update() {
      // Weeks before birth maintain fixed size
        if (this.isBeforeBirth) {
            this.targetSize = this.baseSize;
            this.currentSize = this.baseSize;
            return;
        }
        
      // Set the target size based on hover state
        if (this.isHovered) {
            this.targetSize = this.baseSize * 1.25; // 25% zoom
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
     * @param {number} currentWeekIndex - The current week index (for current year)
     * @param {number} currentDisplayYear - The year currently being displayed
     * @param {Date} birthDate - The user's birth date (to check if week is before birth)
     * @param {Date} today - The current date (passed from draw() to avoid creating it 52 times per frame)
     */
    display(currentWeekIndex, currentDisplayYear, birthDate, today) {
      // First, update the size animation
        this.update();
        this.updateBreathing();
        
        // Apply alpha for fade transitions
        push();
        drawingContext.globalAlpha = this.alpha / 255;
        
        strokeWeight(2);
        
        // Use cached hasData (calculated once in updateState, not every frame)
        let hasData = this.hasData;
        
        // Use cached state (calculated once, not every frame)
        // isBeforeBirth, isPast, and weekRange are already calculated in updateState()
        // Use passed today parameter instead of creating new Date() every frame
        let isCurrent = (this.id === currentWeekIndex && currentDisplayYear === today.getFullYear());

        // Rule 1: Set fill colour based on data and time
        // If week is before birth, grey it out regardless of data
        let baseFillColor;
        if (this.isBeforeBirth) {
            // Grey out weeks before birth - use a muted grey color (fully opaque)
            baseFillColor = color(180, 180, 180, 255); // Light grey, fully opaque
        } else if (hasData) {
            if (this.isPast) {
                // Data in the past = Memory
                baseFillColor = color(this.filledColourMemory);
            } else if (isCurrent) {
                // Data in current week = Memory (same as past)
                baseFillColor = color(this.filledColourMemory);
            } else {
                // Data in the future = Goal
                baseFillColor = color(this.filledColourGoal);
            }
        } else {
            // No data - different colors for past, current, and future
            if (this.isPast) {
                // Empty past weeks = lighter color with soft transparency to indicate missing memory
                baseFillColor = color(this.emptyColourPast + "99");
            } else {
                // Empty future weeks = original empty color with transparency
                baseFillColor = color(this.emptyColour + "66"); // Hex '66' ~ 40% alpha
            }
        }
        
        // Adjust color on hover (only for interactive weeks)
        if (this.isHovered && !this.isBeforeBirth) {
            let r = red(baseFillColor);
            let g = green(baseFillColor);
            let b = blue(baseFillColor);
            let a = alpha(baseFillColor);
            
            // Different hover effects based on circle type
            if (hasData && !this.isPast && !isCurrent) {
                // Goals (golden circles) - darken and increase saturation
                // First darken slightly
                r = max(0, r - r * 0.05);
                g = max(0, g - g * 0.05);
                b = max(0, b - b * 0.05);
                // Then increase saturation by boosting the dominant color (golden = more red/green)
                let avg = (r + g + b) / 3;
                r = min(255, r + (r - avg) * 0.4);
                g = min(255, g + (g - avg) * 0.4);
                b = max(0, b - (avg - b) * 0.2); // Reduce blue to make it more golden
            } else if (hasData && (this.isPast || isCurrent)) {
                // Filled memories - darken more (40%)
                r = max(0, r - r * 0.4);
                g = max(0, g - g * 0.4);
                b = max(0, b - b * 0.4);
            } else if (!hasData && this.isPast) {
                // Empty past circles - darken more (30%)
                r = max(0, r - r * 0.3);
                g = max(0, g - g * 0.3);
                b = max(0, b - b * 0.3);
            } else {
                // Empty future circles - darken less (20%)
                r = max(0, r - r * 0.2);
                g = max(0, g - g * 0.2);
                b = max(0, b - b * 0.15); // Just to make color more distinct from base color
            }
            baseFillColor = color(r, g, b, a);
        }
        
        fill(baseFillColor);
        
        // Rule 2: Highlight the current week (but not if before birth)
        let borderColor;
        if (isCurrent && !this.isBeforeBirth) {
            borderColor = color(this.currentWeekColour);
            strokeWeight(6);
        } else {
            // Grey out border for weeks before birth
            if (this.isBeforeBirth) {
                borderColor = color(150, 150, 150, 255); // Muted grey border, fully opaque
            } else {
                borderColor = color(this.borderColour);
            }
            strokeWeight(2);
        }
        
        // Darken the border color on hover
        if (this.isHovered && !this.isBeforeBirth && !isCurrent) {
            let r = red(borderColor);
            let g = green(borderColor);
            let b = blue(borderColor);
            let a = alpha(borderColor);
            // Darken by 20% towards black
            r = max(0, r - r * 0.2);
            g = max(0, g - g * 0.2);
            b = max(0, b - b * 0.2);
            borderColor = color(r, g, b, a);
        }
        
        stroke(borderColor);
    
        // Calculate visual position (including breathing offset)
        const drawY = this.y + this.visualOffsetY;
        
        // Draw the circle
        circle(this.x, drawY, this.currentSize);
        
        // Draw week number text
        this.drawWeekNumber(currentWeekIndex, drawY);
        
        pop();
    }
    
    /**
     * updateLayout()
     * Updates the circle's position and size based on new layout parameters
     * Used for window resize optimization - avoids recreating all circles
     * @param {number} newX - New x position
     * @param {number} newY - New y position
     * @param {number} newSize - New base size
     */
    updateLayout(newX, newY, newSize) {
        this.x = newX;
        this.y = newY;
        this.baseSize = newSize;
        // Reset current size to match new base size
        this.currentSize = newSize;
        this.targetSize = newSize;
        this.breathAmplitude = Math.min(6, this.baseSize * 0.08);
    }
    
    /**
     * drawWeekNumber()
     * Draws the week number text on hover or for current week
     * @param {number} currentWeekIndex - The current week index
     * @param {number} drawY - The visual y-coordinate (including breathing offset)
     */
    drawWeekNumber(currentWeekIndex, drawY) {
        // Weeks before birth don't display week numbers
        if (this.isBeforeBirth) {
            return;
        }
        
        // Show week number on hover OR if it's the current week
        if (this.isHovered || this.id === currentWeekIndex) {
            push();
            noStroke();
            
            // Use cached hasData (calculated once in updateState, not every frame)
            let hasData = this.hasData;
            let isCurrent = (this.id === currentWeekIndex);
            
            // Determine if this is a goal week (has data, future week, yellow background)
            let isGoalWeek = hasData && !this.isPast && !isCurrent;
            
            // Set text color based on week type:
            // - Goal weeks (yellow background): use dark text for visibility
            // - Memory weeks (dark background): use light text for visibility
            // - Empty weeks (light background): use dark text for visibility
            if (isGoalWeek) {
                // Goal week (yellow background) - use dark text
                fill(this.filledColourMemory);
            } else if (hasData) {
                // Memory week (dark background) - use light text
                fill(this.emptyColour);
            } else {
                // Empty week (light background) - use dark text
                fill(this.filledColourMemory);
            }
            
            textAlign(LEFT, TOP);
            // Responsive text size for week number
            let weekNumSize = windowWidth < 600 ? 8 : windowWidth < 900 ? 10 : 12;
            textSize(weekNumSize);
            textStyle(ITALIC);
            // Responsive offset based on circle size
            let offsetX = this.baseSize * 0.15;
            let offsetY = this.baseSize * 0.20;
            text(this.id + 1, this.x - this.baseSize / 2 + offsetX, drawY - this.baseSize / 2 + offsetY);
    
            // Weeks since birth (center, larger) - same color logic
            if (isGoalWeek) {
                // Goal week (yellow background) - use dark text
                fill(this.filledColourMemory);
            } else if (hasData) {
                // Memory week (dark background) - use light text
                fill(this.emptyColour);
            } else {
                // Empty week (light background) - use dark text
                fill(this.filledColourMemory);
            }
            
            textAlign(CENTER, CENTER);
            // Responsive text size for weeks since birth
            let weeksSize = windowWidth < 600 ? 15 : windowWidth < 900 ? 20 : 25;
            textSize(weeksSize);
            text(this.weeksSinceBirth.toLocaleString(), this.x, drawY);
            
            pop();
        }
    }
}