/**
 * AudioManager.js
 * Handles all audio-related functionality including hover sounds and background music
 * 
 * Note: This module relies on global variables from sketch.js:
 * - osc: p5.Oscillator for hover sounds
 * - env: p5.Envelope for hover sound envelope
 * - lastTickTime: Timestamp of last hover sound
 * - TICK_GAP_MS: Minimum time between hover sounds
 * - bgMusic: p5.Sound object for background music
 * - musicPlaying: Boolean indicating if music is playing
 * - musicVolume: Volume level for background music
 * - musicStarted: Boolean indicating if music has been started
 */

/**
 * playTick()
 * Plays a hover sound with debouncing
 */
function playTick() {
  const now = millis();
  if (now - lastTickTime < TICK_GAP_MS) return; // Debounce
  if (env && osc) env.play(osc);
  lastTickTime = now;
}

/**
 * setupBackgroundMusic()
 * Sets up the loaded background music file
 */
function setupBackgroundMusic() {
  if (bgMusic) {
    // Set volume and loop settings
    bgMusic.setVolume(musicVolume);
    bgMusic.loop(); // Loop the music
    bgMusic.stop(); // Start stopped, will be played on first interaction
  }
}

/**
 * startBackgroundMusic()
 * Starts the background music with fade-in
 */
function startBackgroundMusic() {
  if (!musicStarted && bgMusic) {
    musicStarted = true;
    musicPlaying = true;
    
    // Start playing the music
    bgMusic.play();
    // Update the icon
    updateMusicIcon();
  }
}

/**
 * toggleBackgroundMusic()
 * Toggles background music on/off
 */
function toggleBackgroundMusic() {
  if (bgMusic) {
    if (musicPlaying) {
      // Stop the music
      bgMusic.stop();
      musicPlaying = false;
    } else {
      // Start the music
      bgMusic.play();
      musicPlaying = true;
    }
    // Update the icon
    updateMusicIcon();
  }
}

/**
 * updateMusicIcon()
 * Updates the music toggle button icon based on current music state
 */
function updateMusicIcon() {
  let musicIcon = document.getElementById('music-icon');
  if (musicIcon) {
    musicIcon.textContent = musicPlaying ? '♫' : 'Ⓧ';
  }
}

