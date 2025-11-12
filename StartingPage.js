/**
 * StartingPage Class
 * Handles the animated intro sequence with questions and DOB entry
 */
class StartingPage {
  constructor() {
    // State machine: 'questions' -> 'finalPrompt' -> 'dobEntry' -> 'transitioning' -> 'complete'
    this.state = 'questions';
    
    // Questions sequence
    this.questions = [
      "Are you paying attention to what you're paying attention to?",
      "What single moment from this year will you remember?",
      "You have about 4,000 weeks. Are you making them count?"
    ];
    this.currentQuestionIndex = 0;
    
    // Animation timing (in milliseconds)
    this.fadeInDuration = 1500;    // 1.5s
    this.holdDuration = 3000;      // 3s
    this.fadeOutDuration = 1500;   // 1.5s
    this.totalQuestionDuration = this.fadeInDuration + this.holdDuration + this.fadeOutDuration;
    
    // Animation state
    this.questionStartTime = 0;
    this.finalPromptStartTime = 0;
    this.finalPromptHoldDuration = 2000; // 2s hold for final prompt
    
    // Iris wipe transition
    this.transitionStartTime = 0;
    this.transitionDuration = 1500;      // 1.5s transition
    this.maxRadius = 0;
    
    // DOB entry
    this.dobInput = null;
    this.dobSubmitBtn = null;
    this.dobErrorMsg = null;
    this.dobFormVisible = false;
    
    // Skip button
    this.skipButtonVisible = true;
    
    // Background colors
    this.introBackgroundColor = "#191919"; // Darker grey
    this.mainBackgroundColor = "#F7F6E4";  // Light beige
  }

  /**
   * display()
   * Main display function that handles all states
   */
  display() {
    // Set dark background for intro
    background(this.introBackgroundColor);
    
    // Handle different states
    switch (this.state) {
      case 'questions':
        this.displayQuestions();
        break;
      case 'finalPrompt':
        this.displayFinalPrompt();
        break;
      case 'dobEntry':
        this.displayDOBEntry();
        break;
      case 'transitioning':
        this.displayTransition();
        break;
      case 'complete':
        // Transition complete, main app will take over
        break;
    }
    
    // Draw skip button (always visible except during transition) - draw on top
    if (this.skipButtonVisible && this.state !== 'transitioning' && this.state !== 'complete') {
      this.drawSkipButton();
    }
  }

  /**
   * displayQuestions()
   * Displays the question sequence with fade in/out
   */
  displayQuestions() {
    if (this.currentQuestionIndex >= this.questions.length) {
      // All questions shown, move to final prompt
      this.state = 'finalPrompt';
      this.finalPromptStartTime = millis();
      return;
    }
    
    // Initialize start time for current question
    if (this.questionStartTime === 0) {
      this.questionStartTime = millis();
      // Initialize with minimal alpha to make text visible immediately
    }
    
    let elapsed = millis() - this.questionStartTime;
    let currentQuestion = this.questions[this.currentQuestionIndex];
    
    // Calculate alpha based on phase
    let alpha = 0;
    if (elapsed < this.fadeInDuration) {
      // Fade in
      alpha = map(elapsed, 0, this.fadeInDuration, 0, 255);
    } else if (elapsed < this.fadeInDuration + this.holdDuration) {
      // Hold
      alpha = 255;
    } else if (elapsed < this.totalQuestionDuration) {
      // Fade out
      alpha = map(elapsed, this.fadeInDuration + this.holdDuration, this.totalQuestionDuration, 255, 0);
    } else {
      // Move to next question
      this.currentQuestionIndex++;
      this.questionStartTime = 0; // Reset for next question
      return;
    }
    
    // Draw question
    push();
    noStroke();
    
    // Responsive text size
    let fontSize = windowWidth < 600 ? 18 : windowWidth < 900 ? 24 : 32;
    textSize(fontSize);
    textStyle(ITALIC);
    
    // Check if this is the "4,000 weeks" question (index 2) and color it specially
    if (this.currentQuestionIndex === 2) {
      // Split text to color "4,000 weeks" differently
      textAlign(LEFT, CENTER);
      
      let textBefore = "You have about ";
      let textWeeks = "4,000 weeks";
      let textAfter = ". Are you making them count?";
      
      // Calculate text widths - MUST use same font settings as drawing
      let textWidthBefore = textWidth(textBefore);
      let textWidthWeeks = textWidth(textWeeks);
      let textWidthAfter = textWidth(textAfter);
      let totalWidth = textWidthBefore + textWidthWeeks + textWidthAfter;
      
      // Calculate start position to center the entire text block
      let startX = width / 2 - totalWidth / 2;
      let yPos = height / 2;
      
      // Draw text parts in strict left-to-right order
      let currentX = startX;
      
      // 1. Draw "You have about " first
      fill(255, 255, 255, alpha);
      text(textBefore, currentX, yPos);
      currentX += textWidthBefore;
      
      // 2. Draw "4,000 weeks" with special color (apply alpha fade)
      fill(244, 205, 127, alpha); // #f4cd7f with alpha
      text(textWeeks, currentX, yPos);
      currentX += textWidthWeeks;
      
      // 3. Draw ". Are you making them count?" last
      fill(255, 255, 255, alpha);
      text(textAfter, currentX, yPos);
    } else {
      // Regular question display
      textAlign(CENTER, CENTER);
      fill(255, 255, 255, alpha);
      
      // Wrap text on mobile
      if (windowWidth < 600 && currentQuestion.length > 40) {
        // Simple word wrapping for mobile
        let words = currentQuestion.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (let word of words) {
          if ((currentLine + word).length > 35) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine += (currentLine ? ' ' : '') + word;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        // Draw multiple lines
        let lineHeight = fontSize * 1.4;
        let startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
        for (let i = 0; i < lines.length; i++) {
          text(lines[i], width / 2, startY + i * lineHeight);
        }
      } else {
        text(currentQuestion, width / 2, height / 2);
      }
    }
    
    pop();
  }

  /**
   * displayFinalPrompt()
   * Displays the final "Your Momentry begins." prompt
   */
  displayFinalPrompt() {
    if (this.finalPromptStartTime === 0) {
      this.finalPromptStartTime = millis();
    }
    
    let elapsed = millis() - this.finalPromptStartTime;
    let alpha = 0;
    
    // Fade in
    if (elapsed < this.fadeInDuration) {
      alpha = map(elapsed, 0, this.fadeInDuration, 0, 255);
    } else {
      // Hold at full opacity
      alpha = 255;
    }
    
    // Draw final prompt with "Momentry" in special color
    push();
    noStroke();
    
    // Responsive text size
    let fontSize = windowWidth < 600 ? 20 : windowWidth < 900 ? 28 : 36;
    textSize(fontSize);
    textStyle(ITALIC);
    textAlign(LEFT, CENTER);
    
    // Split text to color "Momentry" differently
    let textBefore = "Your ";
    let textMomentry = "Momentry";
    let textAfter = " begins now.";
    
    // Calculate text widths - MUST use same font settings as drawing
    // Store widths before any drawing operations
    let textWidthBefore = textWidth(textBefore);
    let textWidthMomentry = textWidth(textMomentry);
    let textWidthAfter = textWidth(textAfter);
    let totalWidth = textWidthBefore + textWidthMomentry + textWidthAfter;
    
    // Calculate start position to center the entire text block
    let startX = width / 2 - totalWidth / 2;
    let yPos = height / 2;
    
    // Draw text parts in strict left-to-right order
    // Position each part by accumulating the width of previous parts
    let currentX = startX;
    
    // 1. Draw "Your " first (leftmost)
    fill(255, 255, 255, alpha);
    text(textBefore, currentX, yPos);
    currentX += textWidthBefore;      // Move position right
    
    // 2. Draw "Momentry" second with alpha fade
    fill(244, 205, 127, alpha);       // #f4cd7f with alpha
    text(textMomentry, currentX, yPos);
    currentX += textWidthMomentry;    // Move position right
    
    // 3. Draw " begins." third
    fill(255, 255, 255, alpha);
    text(textAfter, currentX, yPos);
    
    // Draw "click to begin" message below (flashing)
    if (alpha >= 200) { // Only show when main text is visible enough
      let hintFontSize = windowWidth < 600 ? 12 : windowWidth < 900 ? 14 : 16;
      textSize(hintFontSize);
      textStyle(NORMAL);
      textAlign(CENTER, CENTER);
      
      // Flashing effect (pulse between 100 and 255 alpha) - slower
      let flashSpeed = 0.4; // Flashing speed
      let flashAlpha = 127.5 + sin(millis() / 1000 * flashSpeed * TWO_PI) * 127.5;
      fill(150, 150, 150, flashAlpha * (alpha / 255));  // Grey color with flashing
      
      let hintY = yPos + fontSize * 1.5;                // Position below main text
      text("click to begin", width / 2, hintY);
    }
    
    pop();
  }

  /**
   * displayDOBEntry()
   * Displays the DOB entry form
   */
  displayDOBEntry() {
    if (!this.dobFormVisible) {
      this.createDOBForm();
      this.dobFormVisible = true;
    }
    
    // Form is handled by HTML/CSS
    let formContainer = document.getElementById('dob-entry-form');
    if (formContainer) {
      formContainer.style.display = 'flex';
    }
  }

  /**
   * createDOBForm()
   * Creates the DOB entry form in the DOM
   */
  createDOBForm() {
    // Remove existing form if any
    let existingForm = document.getElementById('dob-entry-form');
    if (existingForm) {
      existingForm.remove();
    }
    
    // Create form container
    let formContainer = document.createElement('div');
    formContainer.id = 'dob-entry-form';
    formContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(45, 45, 45, 0.95);
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 300px;
      max-width: 90%;
    `;
    
    // Title
    let title = document.createElement('h2');
    title.textContent = 'Enter Your Date of Birth';
    title.style.cssText = `
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: normal;
    `;
    formContainer.appendChild(title);
    
    // Input
    let input = document.createElement('input');
    input.type = 'date';
    input.id = 'dob-input';
    input.style.cssText = `
      padding: 12px;
      font-size: 16px;
      border: 2px solid #ff914d;
      border-radius: 8px;
      background: #ffffff;
      color: #525349;
      outline: none;
    `;
    // Limit year to 4 digits by adding max attribute
    input.setAttribute('max', '9999-12-31');
    // Add input validation to prevent invalid years
    input.oninput = (e) => {
      let value = e.target.value;
      if (value) {
        let year = parseInt(value.split('-')[0]);
        if (year > 9999) {
          // Reset to valid date if year exceeds 4 digits
          let parts = value.split('-');
          parts[0] = '9999';
          e.target.value = parts.join('-');
        }
      }
    };
    // Allow Enter key to submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleDOBSubmit();
      }
    });
    formContainer.appendChild(input);
    this.dobInput = input;
    
    // Error message
    let errorMsg = document.createElement('div');
    errorMsg.id = 'dob-error-msg';
    errorMsg.style.cssText = `
      color: #ff6b6b;
      font-size: 14px;
      min-height: 20px;
      display: none;
    `;
    formContainer.appendChild(errorMsg);
    this.dobErrorMsg = errorMsg;
    
    // Submit button
    let submitBtn = document.createElement('button');
    submitBtn.textContent = 'Continue';
    submitBtn.id = 'dob-submit-btn';
    submitBtn.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      background: #ff914d;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    submitBtn.onmouseover = () => submitBtn.style.background = '#e67d3a';
    submitBtn.onmouseout = () => submitBtn.style.background = '#ff914d';
    submitBtn.onclick = () => this.handleDOBSubmit();
    formContainer.appendChild(submitBtn);
    this.dobSubmitBtn = submitBtn;
    
    // Add to body
    document.body.appendChild(formContainer);
    
    // Focus on input
    setTimeout(() => input.focus(), 100);
  }

  /**
   * handleDOBSubmit()
   * Handles DOB form submission
   */
  handleDOBSubmit() {
    let dateString = this.dobInput.value;
    
    if (!dateString) {
      this.showError("Please enter a date.");
      return;
    }
    
    let date = new Date(dateString);
    
    // Validate date
    if (isNaN(date.getTime())) {
      this.showError("Invalid date format.");
      return;
    }
    
    if (date >= new Date()) {
      this.showError("Please enter a past date.");
      return;
    }
    
    // Save birth date
    localStorage.setItem('userBirthDate', dateString);
    
    // Hide form
    let formContainer = document.getElementById('dob-entry-form');
    if (formContainer) {
      formContainer.style.display = 'none';
    }
    
    // Start transition
    this.state = 'transitioning';
    this.transitionStartTime = millis();
    this.maxRadius = sqrt(width * width + height * height) / 2;
  }

  /**
   * showError()
   * Shows error message
   */
  showError(message) {
    if (this.dobErrorMsg) {
      this.dobErrorMsg.textContent = message;
      this.dobErrorMsg.style.display = 'block';
    }
  }

  /**
   * displayTransition()
   * Displays the iris wipe transition
   */
  displayTransition() {
    let elapsed = millis() - this.transitionStartTime;
    let progress = min(elapsed / this.transitionDuration, 1);
    
    // Ease out function for smooth transition
    let easedProgress = 1 - pow(1 - progress, 3);
    let currentRadius = this.maxRadius * easedProgress;
    
    // Draw dark background
    background(this.introBackgroundColor);
    
    // Draw iris wipe effect
    push();
    noStroke();
    fill(this.mainBackgroundColor);
    ellipse(width / 2, height / 2, currentRadius * 2, currentRadius * 2);
    pop();
    
    // Transition complete
    if (progress >= 1) {
      this.state = 'complete';
      // Remove DOB form if still exists
      let formContainer = document.getElementById('dob-entry-form');
      if (formContainer) {
        formContainer.remove();
      }
    }
  }

  /**
   * drawSkipButton()
   * Draws the skip button in bottom-right
   */
  drawSkipButton() {
    push();
    textAlign(RIGHT, BOTTOM);
    noStroke();
    
    // Check if mouse is hovering over skip button
    let bounds = this.getSkipButtonBounds();
    let isHovered = mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
                    mouseY >= bounds.y && mouseY <= bounds.y + bounds.height;
    
    // Use orange color on hover, white otherwise
    if (isHovered) {
      fill("#ff914d");
    } else {
      fill(255, 255, 255, 200); // Semi-transparent white
    }
    
    textSize(16);
    textStyle(NORMAL);
    
    let padding = 20;
    text("Skip", width - padding, height - padding);
    pop();
  }
  
  /**
   * getSkipButtonBounds()
   * Returns the bounds of the skip button for click detection
   * @returns {Object} - Object with x, y, width, height
   */
  getSkipButtonBounds() {
    let padding = 20;
    // Clickable area is larger for better UX
    let textWidth = 80;    // Larger clickable area
    let textHeight = 30;   // Larger clickable area
    return {
      x: width - padding - textWidth,
      y: height - padding - textHeight,
      width: textWidth,
      height: textHeight
    };
  }

  /**
   * handleClick()
   * Handles clicks on the starting page
   * @returns {boolean} - True if ready to proceed to main app
   */
  handleClick(mouseX, mouseY) {
    // Check if skip button was clicked
    if (this.skipButtonVisible && this.state !== 'transitioning' && this.state !== 'complete') {
      let bounds = this.getSkipButtonBounds();
      
      if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
          mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
        this.skipSequence();
        return false;
      }
    }
    
    // If in questions state, clicking anywhere advances to next question
    if (this.state === 'questions') {
      this.advanceToNextQuestion();
      return false;
    }
    
    // If in final prompt state, clicking anywhere proceeds to DOB entry
    if (this.state === 'finalPrompt') {
      this.state = 'dobEntry';
      this.skipButtonVisible = false;
      return false;
    }
    
    // If transitioning or complete, don't handle clicks
    if (this.state === 'transitioning' || this.state === 'complete') {
      return false;
    }
    
    return false;
  }
  
  /**
   * advanceToNextQuestion()
   * Advances to the next question immediately
   */
  advanceToNextQuestion() {
    // Move to next question
    this.currentQuestionIndex++;
    this.questionStartTime = 0; // Reset timer for new question
    
    // If all questions are done, move to final prompt
    if (this.currentQuestionIndex >= this.questions.length) {
      this.state = 'finalPrompt';
      this.finalPromptStartTime = millis();
    }
  }

  /**
   * skipSequence()
   * Skips the question sequence and goes directly to DOB entry
   */
  skipSequence() {
    this.state = 'dobEntry';
    this.skipButtonVisible = false;
    // Reset question timing
    this.currentQuestionIndex = this.questions.length;
    this.questionStartTime = 0;
    this.finalPromptStartTime = 0;
  }
  
  /**
   * startTransitionFromExisting()
   * Starts the iris wipe transition when birth date already exists
   * This skips the intro sequence and goes directly to the transition
   */
  startTransitionFromExisting() {
    this.state = 'transitioning';
    this.transitionStartTime = millis();
    this.maxRadius = sqrt(width * width + height * height) / 2;
    this.skipButtonVisible = false;
  }

  /**
   * isComplete()
   * Checks if the intro sequence is complete
   * @returns {boolean} - True if transition is complete
   */
  isComplete() {
    return this.state === 'complete';
  }

  /**
   * checkIfBirthDateExists()
   * Checks if birth date is already saved
   * @returns {boolean} - True if birth date exists
   */
  static checkIfBirthDateExists() {
    let savedBirthDate = localStorage.getItem('userBirthDate');
    return savedBirthDate !== null;
  }

  /**
   * getSavedBirthDate()
   * Gets the saved birth date
   * @returns {Date|null} - The saved birth date or null
   */
  static getSavedBirthDate() {
    let savedBirthDate = localStorage.getItem('userBirthDate');
    return savedBirthDate ? new Date(savedBirthDate) : null;
  }
}