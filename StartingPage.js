/**
 * StartingPage Class
 * Handles the initial page where users enter their birth date
 */
class StartingPage {
  constructor() {
    this.title = "Welcome to Momentry - Your Life, One Week at a Time";
    this.subtitle = "Click to enter your date of birth";
    this.note = "(This will be saved locally)";
    this.titleColor = "#525349";
    this.subtitleColor = "#525349";
    this.noteColor = "#8B8B8B";
  }

  /**
   * display()
   * Draws the starting page
   */
  display() {
    push();
    noStroke(); // Ensure text has no borders
    
    // Responsive text sizes
    let titleSize = windowWidth < 600 ? 20 : windowWidth < 900 ? 26 : 32;
    let subtitleSize = windowWidth < 600 ? 14 : windowWidth < 900 ? 16 : 18;
    let noteSize = windowWidth < 600 ? 11 : windowWidth < 900 ? 12 : 14;
    let hintSize = windowWidth < 600 ? 12 : windowWidth < 900 ? 14 : 16;
    
    // Responsive vertical spacing
    let titleOffset = windowWidth < 600 ? -60 : windowWidth < 900 ? -80 : -100;
    let noteOffset = windowWidth < 600 ? 30 : windowWidth < 900 ? 35 : 40;
    let hintOffset = windowWidth < 600 ? 55 : windowWidth < 900 ? 70 : 80;
    
    // Draw title
    textAlign(CENTER, CENTER);
    fill(this.titleColor);
    textSize(titleSize);
    // Wrap long title on mobile
    if (windowWidth < 600) {
      // Split title into two lines on mobile
      let words = this.title.split(' ');
      let midPoint = Math.ceil(words.length / 2);
      let line1 = words.slice(0, midPoint).join(' ');
      let line2 = words.slice(midPoint).join(' ');
      text(line1, width / 2, height / 2 + titleOffset);
      text(line2, width / 2, height / 2 + titleOffset + titleSize * 1.2);
    } else {
      text(this.title, width / 2, height / 2 + titleOffset);
    }
    
    // Draw subtitle
    textSize(subtitleSize);
    fill(this.subtitleColor);
    let subtitleY = windowWidth < 600 ? height / 2 - 20 : height / 2;
    text(this.subtitle, width / 2, subtitleY);
    
    // Draw note
    textSize(noteSize);
    fill(this.noteColor);
    text(this.note, width / 2, height / 2 + noteOffset);
    
    // Draw a subtle hint about the visualization
    textSize(hintSize);
    fill(this.noteColor);
    // Wrap hint text on mobile
    if (windowWidth < 600) {
      text("Each circle represents", width / 2, height / 2 + hintOffset);
      text("one week of your life", width / 2, height / 2 + hintOffset + hintSize * 1.2);
    } else {
      text("Each circle represents one week of your life", width / 2, height / 2 + hintOffset);
    }
    
    pop();
  }

  /**
   * handleClick()
   * Handles mouse clicks on the starting page
   * @returns {boolean} - True if birth date was successfully entered
   */
  handleClick() {
    let dateString = prompt("Enter your date of birth (YYYY-MM-DD):\n\nExample: 1990-05-15");
    
    if (dateString) {
      let date = new Date(dateString);
      
      // Validate date
      if (!isNaN(date.getTime()) && date < new Date()) {
        // Save birth date to localStorage
        localStorage.setItem('userBirthDate', dateString);
        
        // Return true - initialization will be handled by sketch.js
        return true;
      } else {
        alert("Invalid date format or future date. Please use YYYY-MM-DD format and enter a past date.");
        return false;
      }
    }
    
    return false;
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
