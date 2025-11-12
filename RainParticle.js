/**
 * RainParticle.js
 * Represents a single rain particle in the soulful rain effect
 * Creates a zen-like atmosphere with subtle, gentle falling rain
 */
class RainParticle {
  /**
   * Constructor
   * Initializes a rain particle with random properties
   */
  constructor() {
    // Position - start at random x, random y across entire canvas (including off-screen above)
    // This makes it appear as if it has always been raining
    this.x = random(0, width);
    this.y = random(-200, height); // Spread across entire canvas height
    
    // Movement properties
    this.speed = random(2, 4); // Faster fall for more dynamic rain
    this.length = random(8, 20); // Short to medium length lines
    
    // Visual properties - subtle and zen-like
    this.alpha = random(20, 60); // Low alpha for subtlety (0-255)
    this.strokeWeight = random(0.5, 1.5); // Thin lines
    
    // Repulsion properties
    this.repulsionRadius = 300; // Distance at which mouse affects particle
    this.repulsionStrength = 0.6; // Push strength
  }
  
  /**
   * update()
   * Updates particle position and handles wrapping and cursor repulsion
   */
  update() {
    // Apply cursor repulsion if mouse is nearby
    let distanceToMouse = dist(this.x, this.y, mouseX, mouseY);
    
    if (distanceToMouse < this.repulsionRadius && distanceToMouse > 0) {
      // Calculate repulsion force (push away from cursor)
      let angle = atan2(this.y - mouseY, this.x - mouseX);
      let force = map(distanceToMouse, 0, this.repulsionRadius, this.repulsionStrength, 0);
      
      // Apply force perpendicular to rain direction (mostly horizontal)
      this.x += cos(angle) * force * 2;
      this.y += sin(angle) * force * 0.5; // Less vertical push
    }
    
    // Normal falling motion
    this.y += this.speed;
    
    // Wrapping: when particle reaches bottom, reset to top
    if (this.y > height) {
      this.y = random(-100, 0);
      this.x = random(0, width);
    }
    
    // Also wrap horizontally if particle goes off screen (due to repulsion)
    if (this.x < 0) {
      this.x = width;
    } else if (this.x > width) {
      this.x = 0;
    }
  }
  
  /**
   * display()
   * Draws the rain particle as a subtle line
   */
  display() {
    push();
    
    // Set subtle appearance
    stroke(100, 100, 100, this.alpha); // Light grey/off-white
    strokeWeight(this.strokeWeight);
    
    // Draw as a line falling downward
    let endY = this.y + this.length;
    line(this.x, this.y, this.x, endY);
    
    pop();
  }
}

