/**
 * Speech Controller Module
 * Handles text-to-speech synthesis with controls for speed, pitch, voice selection
 * and text highlighting during speech
 */

class SpeechController {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.voices = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.textElement = null;
        
        // Speech settings
        this.settings = {
            rate: 1.0,      // Speed (0.5 - 2.0)
            pitch: 1.0,     // Pitch (0.5 - 2.0)
            volume: 1.0,    // Volume (0.0 - 1.0)
            voice: null     // Selected voice
        };

        // Callbacks
        this.onStart = null;
        this.onEnd = null;
        this.onPause = null;
        this.onResume = null;
        this.onError = null;
        this.onProgress = null;

        // Initialize
        this.loadVoices();
        
        // Handle voice loading
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }

    /**
     * Load available voices
     */
    loadVoices() {
        this.voices = this.synth.getVoices().filter(voice => voice.lang.startsWith('en'));
        
        // Set default voice
        if (!this.settings.voice && this.voices.length > 0) {
            const defaultVoice = this.voices.find(voice => voice.default);
            this.settings.voice = defaultVoice || this.voices[0];
        }
    }

    /**
     * Get available voices
     * @returns {Array} - Array of available voices
     */
    getVoices() {
        return this.voices;
    }

    /**
     * Set speech rate (speed)
     * @param {number} rate - Speech rate (0.5 - 2.0)
     */
    setRate(rate) {
        this.settings.rate = Math.max(0.5, Math.min(2.0, parseFloat(rate)));
    }

    /**
     * Set speech pitch
     * @param {number} pitch - Speech pitch (0.5 - 2.0)
     */
    setPitch(pitch) {
        this.settings.pitch = Math.max(0.5, Math.min(2.0, parseFloat(pitch)));
    }

    /**
     * Set speech volume
     * @param {number} volume - Speech volume (0.0 - 1.0)
     */
    setVolume(volume) {
        this.settings.volume = Math.max(0.0, Math.min(1.0, parseFloat(volume)));
    }

    /**
     * Set voice
     * @param {SpeechSynthesisVoice} voice - Voice to use
     */
    setVoice(voice) {
        this.settings.voice = voice;
    }

    /**
     * Set voice by name
     * @param {string} voiceName - Name of the voice to use
     */
    setVoiceByName(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.settings.voice = voice;
        }
    }

    /**
     * Start speaking text
     * @param {string} text - Text to speak
     * @param {Array} sentences - Array of sentence objects
     * @param {HTMLElement} textElement - Element containing the text for highlighting
     */
    speak(text, sentences = [], textElement = null) {
        try {
            // Stop any current speech
            this.stop();

            this.sentences = sentences || [];
            this.textElement = textElement;
            this.currentSentenceIndex = 0;

            if (!text || text.trim() === '') {
                throw new Error('No text provided to speak');
            }

            // Ensure voices are loaded
            if (this.voices.length === 0) {
                this.loadVoices();
            }

            // Create utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            this.applySettings();
            this.setupEvents();

            // Start speaking
            this.synth.speak(this.currentUtterance);
            this.isPlaying = true;
            this.isPaused = false;

        } catch (error) {
            console.error('Error starting speech:', error);
            if (this.onError) {
                this.onError(`Error starting speech: ${error.message}`);
            }
        }
    }

    /**
     * Apply current settings to utterance
     */
    applySettings() {
        if (!this.currentUtterance) return;
        
        this.currentUtterance.rate = this.settings.rate;
        this.currentUtterance.pitch = this.settings.pitch;
        this.currentUtterance.volume = this.settings.volume;
        if (this.settings.voice) {
            this.currentUtterance.voice = this.settings.voice;
        }
    }

    /**
     * Set up utterance event handlers
     */
    setupEvents() {
        if (!this.currentUtterance) return;

        this.currentUtterance.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            if (this.onStart) {
                this.onStart();
            }
        };

        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.clearHighlighting();
            if (this.onEnd) {
                this.onEnd();
            }
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isPlaying = false;
            this.isPaused = false;
            this.clearHighlighting();
            if (this.onError) {
                this.onError(`Speech error: ${event.error}`);
            }
        };

        this.currentUtterance.onpause = () => {
            this.isPaused = true;
            if (this.onPause) {
                this.onPause();
            }
        };

        this.currentUtterance.onresume = () => {
            this.isPaused = false;
            if (this.onResume) {
                this.onResume();
            }
        };
    }

    /**
     * Clear all highlighting
     */
    clearHighlighting() {
        if (!this.textElement) return;

        const highlightedElements = this.textElement.querySelectorAll('.highlight-current, .highlight-spoken');
        highlightedElements.forEach(element => {
            element.classList.remove('highlight-current', 'highlight-spoken');
        });
    }

    /**
     * Pause speech
     */
    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
        }
    }

    /**
     * Resume speech
     */
    resume() {
        if (this.isPaused) {
            this.synth.resume();
        }
    }

    /**
     * Stop speech
     */
    stop() {
        this.synth.cancel();
        
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSentenceIndex = 0;
        
        this.clearHighlighting();
        
        if (this.currentUtterance) {
            this.currentUtterance = null;
        }
    }

    /**
     * Check if currently speaking
     * @returns {boolean} - True if speaking
     */
    isSpeaking() {
        return this.isPlaying && !this.isPaused;
    }

    /**
     * Check if speech is paused
     * @returns {boolean} - True if paused
     */
    isPausedState() {
        return this.isPaused;
    }

    /**
     * Get current settings
     * @returns {Object} - Current speech settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Check if Speech Synthesis is supported
     * @returns {boolean} - True if supported
     */
    isSupported() {
        return 'speechSynthesis' in window;
    }

    /**
     * Set callback for speech start
     * @param {Function} callback - Callback function
     */
    setStartCallback(callback) {
        this.onStart = callback;
    }

    /**
     * Set callback for speech end
     * @param {Function} callback - Callback function
     */
    setEndCallback(callback) {
        this.onEnd = callback;
    }

    /**
     * Set callback for speech pause
     * @param {Function} callback - Callback function
     */
    setPauseCallback(callback) {
        this.onPause = callback;
    }

    /**
     * Set callback for speech resume
     * @param {Function} callback - Callback function
     */
    setResumeCallback(callback) {
        this.onResume = callback;
    }

    /**
     * Set callback for errors
     * @param {Function} callback - Error callback function
     */
    setErrorCallback(callback) {
        this.onError = callback;
    }

    /**
     * Set callback for progress updates
     * @param {Function} callback - Progress callback function
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
}

// Export for use in other modules
window.SpeechController = SpeechController;
