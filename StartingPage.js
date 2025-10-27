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
    
    // Draw title
    textAlign(CENTER, CENTER);
    fill(this.titleColor);
    textSize(32);
    text(this.title, width / 2, height / 2 - 100);
    
    // Draw subtitle
    textSize(18);
    fill(this.subtitleColor);
    text(this.subtitle, width / 2, height / 2);
    
    // Draw note
    textSize(14);
    fill(this.noteColor);
    text(this.note, width / 2, height / 2 + 40);
    
    // Draw a subtle hint about the visualization
    textSize(16);
    fill(this.noteColor);
    text("Each circle represents one week of your life", width / 2, height / 2 + 80);
    
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
        
        // Trigger the main app initialization
        if (typeof initializeMainApp === 'function') {
          initializeMainApp();
        }
        
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
