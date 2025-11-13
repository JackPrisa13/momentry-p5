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
    // Starting particles above canvas creates continuous rain effect
    this.x = random(0, width);
    this.y = random(-200, height); // Spread across entire canvas height
    
    // Movement properties
    this.speed = random(2, 7);     // Fall speed range
    this.length = random(8, 20);   // Short to medium length lines
    
    // Visual properties - subtle and zen-like
    this.alpha = random(20, 60);   // Low alpha for subtlety (0-255)
    this.strokeWeight = random(0.5, 1.5); // Thin lines
    
    // Umbrella repulsion properties
    this.repulsionRadius = 70;     // Distance at which mouse affects particle (umbrella size)
    this.repulsionStrength = 2.3;  // Bounce force for umbrella effect
    this.minBounceDistance = 20;   // Minimum distance - particles bounce away more strongly when closer
    
    // Sticking/dripping properties
    this.isStuck = false;                          // Whether particle is stuck to umbrella edge
    this.stickRadius = this.repulsionRadius * 0.9; // Radius where particles can stick (very near edge)
    this.dripSpeed = 0.5;                          // Speed when dripping off edge
    this.stickAngle = null;                        // Angle where particle is stuck on umbrella
    this.willStick = random() > 0.5;               // Random chance - some particles stick, some bounce
    
    // Visual angle of the rain drop line (PI/2 = vertical, 0 = horizontal)
    this.lineAngle = PI / 2;       // Start vertical
    this.releaseSide = null;       // Track which side the particle last dripped from
    
    // Stick animation tracking
    this.stickStartAngle = null;
    this.stickTargetAngle = null;
    this.stickInitialLineAngle = null;
  }
  
  /**
   * update()
   * Updates particle position and handles wrapping and cursor repulsion
   */
  update() {
    // Umbrella is positioned above the cursor
    // Only particles above the cursor should be affected
    let isAboveCursor = this.y < mouseY;
    let distanceToMouse = dist(this.x, this.y, mouseX, mouseY);
    let isNearUmbrella = isAboveCursor && distanceToMouse < this.repulsionRadius && distanceToMouse > 0;
    
    // Slow down when near umbrella (reduced falling speed)
    let currentSpeed = isNearUmbrella ? this.speed * 0.3 : this.speed;
    
    // Baseline falling motion (slower when near umbrella)
    this.y += currentSpeed;
    
    if (isNearUmbrella) {
      // Recalculate distance and angle after movement for accurate repulsion
      distanceToMouse = dist(this.x, this.y, mouseX, mouseY);
      let normalizedDistance = distanceToMouse / this.repulsionRadius;
      let angle = atan2(this.y - mouseY, this.x - mouseX);
      
      // For umbrella above cursor: "bottom edge" is near the cursor
      // Particles near the cursor (small distance) are at the bottom edge
      let nearBottomEdge = distanceToMouse < this.stickRadius * 1.2; // Near cursor = bottom of umbrella
      
      if (nearBottomEdge && !this.isStuck && this.willStick) {
        // Particle hits the bottom edge (near cursor) - start sticking
        this.isStuck = true;
        this.stickAngle = angle;
        let currentIsLeftSide = this.x < mouseX;
        this.stickStartAngle = angle;
        this.stickTargetAngle = currentIsLeftSide ? -PI + 0.08 : -0.08;
        // Store the almost-flat angle for this particle (consistent value)
        const flatAngle = PI / 2.1;
        this.stickInitialLineAngle = currentIsLeftSide ? PI / 2 + flatAngle : PI / 2 - flatAngle;
        // Immediately set line angle to flat when first sticking
        this.lineAngle = this.stickInitialLineAngle;
      }
      
      if (this.isStuck) {
        // Particle is stuck to umbrella edge - slide toward nearest rim edge
        let currentIsLeftSide = this.x < mouseX;
        let slideSpeed = 0.025;
        if (currentIsLeftSide) {
          // Move angle toward -PI (left rim)
          this.stickAngle = max(this.stickAngle - slideSpeed, -PI + 0.05);
        } else {
          // Move angle toward 0 (right rim)
          this.stickAngle = min(this.stickAngle + slideSpeed, 0 - 0.05);
        }
        
        // Update position to follow the edge as it slides down toward cursor
        let targetX = mouseX + cos(this.stickAngle) * this.stickRadius;
        let targetY = mouseY + sin(this.stickAngle) * this.stickRadius;
        
        // Move particle along the edge (slide down toward cursor) - slower, more gradual
        this.x = lerp(this.x, targetX, 0.4);
        this.y = lerp(this.y, targetY, 0.4);
        
        // Add gentle downward motion for dripping (much slower)
        this.y += this.dripSpeed;
        
        // Tilt the rain line toward the sliding side for visual consistency
        // Bottom of line should lean left for left side, right for right side
        // Start almost flat at the top, then gradually return to vertical as it approaches rim
        let travelRange = max(0.0001, abs(this.stickStartAngle - this.stickTargetAngle));
        let currentTravel = abs(this.stickAngle - this.stickStartAngle);
        let travelProgress = constrain(currentTravel / travelRange, 0, 1);
        let slideTargetAngle = lerp(this.stickInitialLineAngle, PI / 2, travelProgress);
        // Increase responsiveness as we approach the rim so the drop is upright near the edge
        let slideSmoothing = lerp(0.25, 0.75, constrain(travelProgress, 0, 1));
        this.lineAngle = lerp(this.lineAngle, slideTargetAngle, slideSmoothing);
        
        // Release when particle reaches rim edge or leaves umbrella influence
        let reachedLeftEdge = currentIsLeftSide && this.stickAngle <= -PI + 0.08;
        let reachedRightEdge = !currentIsLeftSide && this.stickAngle >= -0.08;
        if (reachedLeftEdge || reachedRightEdge || this.y >= mouseY || distanceToMouse > this.repulsionRadius * 1.1) {
          // Dripped off - release it
          this.isStuck = false;
          this.stickAngle = null;
          // Always exit sticking in a vertical orientation to avoid angle jumps
          this.lineAngle = PI / 2;
          this.releaseSide = null;
          this.stickStartAngle = null;
          this.stickTargetAngle = null;
          this.stickInitialLineAngle = null;
          // Give it a gentle push away and resume normal falling
          let releaseAngle = reachedLeftEdge ? -PI / 1.2 : reachedRightEdge ? -PI / 5 : angle;
          this.x += cos(releaseAngle) * 1.2;
          this.y += this.speed * 0.6;
        }
      } else {
        // Particle not stuck - apply bounce/deflection away from umbrella
        // All particles within repulsion radius are repelled
        let bounceForce = this.repulsionStrength * (1 - normalizedDistance);
        
        // Stronger force when closer to prevent particles passing through umbrella
        if (distanceToMouse < this.minBounceDistance) {
          bounceForce *= 3.5; // Much stronger when very close
        } else {
          bounceForce *= 1.5; // Still stronger than before for mid-range
        }
        
        // Bounce away from cursor (upward and outward) - stronger horizontal component
        let bounceX = cos(angle) * bounceForce * 5.5;
        let bounceY = sin(angle) * bounceForce * 3.0;
        
        // Apply bounce forces
        this.x += bounceX;
        this.y += bounceY;
        
        // Additional upward push when very close to prevent particles falling through
        if (distanceToMouse < this.repulsionRadius * 0.5) {
          this.y -= this.speed * 0.8; // Push upward more strongly
        }
        
        // Tilt based on which side particle is on
        // Bottom of line leans left for left side, right for right side
        // Angle approaches horizontal when hitting the top of umbrella
        const flatAngle = PI / 2.1;
        let closeness = constrain(1 - normalizedDistance, 0, 1);
        let flatTargetAngle = (this.x < mouseX) ? PI / 2 + flatAngle : PI / 2 - flatAngle;
        let bounceTargetAngle = lerp(PI / 2, flatTargetAngle, pow(closeness, 0.6));
        let bounceSmoothing = lerp(0.25, 0.75, closeness);
        this.lineAngle = lerp(this.lineAngle, bounceTargetAngle, bounceSmoothing);
        
        // Move along the direction implied by the current line angle
        // This creates a smooth parabolic trajectory as the angle lerps back to vertical
        let desiredDX = cos(this.lineAngle) * currentSpeed;
        let desiredDY = sin(this.lineAngle) * currentSpeed;
        // We already applied vertical fall (0, currentSpeed) earlier,
        // so add the delta needed to follow the angled path.
        this.x += desiredDX;
        this.y += (desiredDY - currentSpeed);
      }
    } else {
      // Not interacting with umbrella - gradually return to vertical
      if (this.releaseSide) {
        // Lerp from the tilted angle back to vertical based on which side it came from
        const flatAngle = PI / 2.1;
        let expectedAngle = this.releaseSide === "left" ? PI / 2 + flatAngle : PI / 2 - flatAngle;
        
        // Reset to correct tilted angle if line angle is on wrong side
        if ((this.releaseSide === "left" && this.lineAngle < PI / 2) ||
            (this.releaseSide === "right" && this.lineAngle > PI / 2)) {
          this.lineAngle = expectedAngle;
        }
        
        this.lineAngle = lerp(this.lineAngle, PI / 2, 0.03);
        if (abs(this.lineAngle - PI / 2) < 0.04) {
          this.releaseSide = null;
        }
      } else {
        // Smoothly lerp back to vertical (PI/2) - slower for more natural trajectory
        this.lineAngle = lerp(this.lineAngle, PI / 2, 0.04);
      }
      
      // Continue moving along the current angle so the trajectory matches the visual tilt
      let desiredDX = cos(this.lineAngle) * this.speed;
      let desiredDY = sin(this.lineAngle) * this.speed;
      this.x += desiredDX;
      this.y += (desiredDY - this.speed);
      
      // Reset stuck state if particle moves away or is below cursor
      if (this.isStuck) {
        this.isStuck = false;
        this.stickAngle = null;
      }
    }
    
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
   * Draws the rain particle as a subtle line at the calculated angle
   */
  display() {
    push();
    
    // Set subtle appearance
    stroke(100, 100, 100, this.alpha); // Light grey/off-white
    strokeWeight(this.strokeWeight);
    
    // Calculate end point of line based on angle
    let endX = this.x + cos(this.lineAngle) * this.length;
    let endY = this.y + sin(this.lineAngle) * this.length;
    
    // Draw line at calculated angle
    line(this.x, this.y, endX, endY);
    
    pop();
  }
}