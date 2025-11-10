/**
 * MouseTrail Class
 * Handles the mouse trail visual effect
 */
class MouseTrail {
  constructor() {
    this.trail = [];
    this.maxTrailLength = 50; // Maximum number of trail points
    this.trailFadeSpeed = 0.05; // How fast the trail fades (0-1)
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.minTrailDistance = 1; // Minimum distance to add new trail point
  }

  /**
   * initialize()
   * Initializes the mouse trail with current mouse position
   */
  initialize() {
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
  }

  /**
   * update()
   * Updates the mouse trail by adding new points and fading old ones
   * @param {boolean} showStartingPage - Whether the starting page is showing
   */
  update(showStartingPage) {
    // Check if modal is open - don't update trail if modal is open
    let modal = document.getElementById('entry-modal');
    let isModalOpen = modal && modal.classList.contains('show');
    
    if (isModalOpen || showStartingPage) {
      // Clear trail when modal opens or on starting page
      this.trail = [];
      return;
    }
    
    // Calculate distance from last trail point
    let distance = dist(mouseX, mouseY, this.lastMouseX, this.lastMouseY);
    
    // Only add new point if mouse moved enough
    if (distance >= this.minTrailDistance) {
      // Add new point at the front of the array
      this.trail.unshift({
        x: mouseX,
        y: mouseY,
        alpha: 1.0,
        size: 8
      });
      
      // Limit trail length
      if (this.trail.length > this.maxTrailLength) {
        this.trail.pop();
      }
      
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    }
    
    // Fade out existing trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= this.trailFadeSpeed;
      this.trail[i].size = Math.max(2, this.trail[i].size * 0.95); // Shrink size
    }
    
    // Remove fully faded points
    this.trail = this.trail.filter(point => point.alpha > 0);
  }

  /**
   * display()
   * Draws the mouse trail on the canvas as a smooth line
   * @param {boolean} showStartingPage - Whether the starting page is showing
   */
  display(showStartingPage) {
    // Check if modal is open or on starting page - don't draw trail
    let modal = document.getElementById('entry-modal');
    let isModalOpen = modal && modal.classList.contains('show');
    
    if (isModalOpen || showStartingPage || this.trail.length < 2) {
      return;
    }
    
    push();
    noFill();
    
    // Draw smooth line connecting consecutive trail points
    // Each segment uses the average properties of its two points for smooth transitions
    for (let i = 0; i < this.trail.length - 1; i++) {
      let point1 = this.trail[i];
      let point2 = this.trail[i + 1];
      
      // Average alpha and size for smooth gradient
      let avgAlpha = (point1.alpha + point2.alpha) / 2;
      let avgSize = (point1.size + point2.size) / 2;
      
      // Set stroke color with alpha that fades from start to end
      // Reduced opacity multiplier (100 instead of 255) for more transparency
      stroke(82, 83, 73, avgAlpha * 100); // #525349 with alpha
      
      // Vary stroke weight - thicker at the start, thinner at the end
      strokeWeight(avgSize / 2);
      
      // Draw line segment between consecutive points
      line(point1.x, point1.y, point2.x, point2.y);
    }
    
    pop();
  }
}

