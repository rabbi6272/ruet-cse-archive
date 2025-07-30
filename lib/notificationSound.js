"use client";

class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.isEnabled = false;
    this.userInteracted = false;
  }

  // Initialize audio context after user interaction
  async initializeAudio() {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Resume context if it's suspended (Chrome requirement)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.isEnabled = true;
      console.log("Audio context initialized");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      this.isEnabled = false;
    }
  }

  // Enable sound after user interaction
  async enableSound() {
    if (!this.userInteracted) {
      this.userInteracted = true;
      await this.initializeAudio();
    }
  }

  // Play notification sound
  async playNotificationSound() {
    if (!this.isEnabled || !this.audioContext) {
      console.log("Audio not available or not initialized");
      return;
    }

    try {
      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Create a professional notification chime with multiple tones
      this.createProfessionalChime();
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  }

  // Create a professional, confident notification chime
  createProfessionalChime() {
    const now = this.audioContext.currentTime;
    const masterGain = this.audioContext.createGain();
    masterGain.connect(this.audioContext.destination);

    // Master volume envelope
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    // First tone: Confident base note (C5 - 523.25 Hz)
    this.createTone(523.25, now, 0.8, masterGain, "sine");

    // Second tone: Professional harmony (E5 - 659.25 Hz)
    this.createTone(659.25, now + 0.15, 0.6, masterGain, "sine");

    // Third tone: Elegant high note (G5 - 783.99 Hz)
    this.createTone(783.99, now + 0.3, 0.4, masterGain, "triangle");

    // Add subtle reverb effect
    this.addReverbEffect(masterGain, now);
  }

  // Create individual tone with envelope
  createTone(frequency, startTime, duration, destination, waveType = "sine") {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Professional envelope: quick attack, sustained, gentle release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.setValueAtTime(0.3, startTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  // Add subtle reverb effect for professional sound
  addReverbEffect(source, startTime) {
    try {
      const delay = this.audioContext.createDelay(0.3);
      const delayGain = this.audioContext.createGain();
      const feedback = this.audioContext.createGain();

      delay.delayTime.setValueAtTime(0.08, startTime);
      delayGain.gain.setValueAtTime(0.15, startTime);
      feedback.gain.setValueAtTime(0.3, startTime);

      source.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.audioContext.destination);
      delayGain.connect(feedback);
      feedback.connect(delay);
    } catch (error) {
      console.log("Reverb effect not available:", error);
    }
  }

  // Alternative: Play using HTML5 Audio (fallback)
  playFallbackSound() {
    try {
      // Create a professional chime using multiple HTML5 Audio instances
      this.playFallbackChime();
    } catch (error) {
      console.log("Could not play fallback sound:", error);
    }
  }

  // Create a professional fallback chime
  playFallbackChime() {
    // Professional notification sound pattern - creates a pleasant chime
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord
    const delays = [0, 150, 300]; // Staggered timing in milliseconds

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.createFallbackTone(freq, 0.6 - index * 0.1, 800 - index * 100);
      }, delays[index]);
    });
  }

  // Create individual fallback tone using oscillator in a simpler way
  createFallbackTone(frequency, duration, fadeOut) {
    try {
      // Use a more direct approach for fallback
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.2,
        audioContext.currentTime + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log("Fallback tone creation failed:", error);
    }
  }
}

// Create singleton instance
const notificationSound = new NotificationSound();

// Auto-initialize on first user interaction
if (typeof window !== "undefined") {
  const initOnInteraction = () => {
    notificationSound.enableSound();
    // Remove listeners after first interaction
    document.removeEventListener("click", initOnInteraction);
    document.removeEventListener("keydown", initOnInteraction);
    document.removeEventListener("touchstart", initOnInteraction);
  };

  document.addEventListener("click", initOnInteraction);
  document.addEventListener("keydown", initOnInteraction);
  document.addEventListener("touchstart", initOnInteraction);
}

export { notificationSound };
