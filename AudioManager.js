/**
 * AudioManager.js
 * Handles all audio-related functionality including hover sounds and background music
 * 
 * Note: This module uses the global app instance from sketch.js:
 * - app.osc: p5.Oscillator for hover sounds
 * - app.env: p5.Envelope for hover sound envelope
 * - app.lastTickTime: Timestamp of last hover sound
 * - app.TICK_GAP_MS: Minimum time between hover sounds
 * - app.bgMusic: p5.Sound object for background music
 * - app.musicPlaying: Boolean indicating if music is playing
 * - app.musicVolume: Volume level for background music
 * - app.musicStarted: Boolean indicating if music has been started
 */

/**
 * playTick()
 * Plays a hover sound with debouncing
 */
function playTick() {
  if (!app) return; // Safety check
  const now = millis();
  if (now - app.lastTickTime < app.TICK_GAP_MS) return; // Debounce
  if (app.env && app.osc) app.env.play(app.osc);
  app.lastTickTime = now;
}

/**
 * setupBackgroundMusic()
 * Sets up the loaded background music file
 */
function setupBackgroundMusic() {
  if (!app || !app.bgMusic) return;
  // Set volume and loop settings
  app.bgMusic.setVolume(app.musicVolume);
  app.bgMusic.loop(); // Loop the music
  app.bgMusic.stop(); // Start stopped, will be played on first interaction
}

/**
 * startBackgroundMusic()
 * Starts the background music with fade-in
 */
function startBackgroundMusic() {
  if (!app || !app.bgMusic) return;
  if (!app.musicStarted) {
    app.musicStarted = true;
    app.musicPlaying = true;
    
    // Start playing the music
    app.bgMusic.play();
    // Update the icon
    updateMusicIcon();
  }
}

/**
 * toggleBackgroundMusic()
 * Toggles background music on/off
 */
function toggleBackgroundMusic() {
  if (!app || !app.bgMusic) return;
  if (app.musicPlaying) {
    // Stop the music
    app.bgMusic.stop();
    app.musicPlaying = false;
  } else {
    // Start the music
    app.bgMusic.play();
    app.musicPlaying = true;
  }
  // Update the icon
  updateMusicIcon();
}

/**
 * updateMusicIcon()
 * Updates the music toggle button icon based on current music state
 */
function updateMusicIcon() {
  if (!app) return;
  let musicIcon = document.getElementById('music-icon');
  if (musicIcon) {
    musicIcon.textContent = app.musicPlaying ? '♫' : 'Ⓧ';
  }
}

