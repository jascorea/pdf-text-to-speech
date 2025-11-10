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
        
        // Timing and highlighting
        this.currentText = '';
        this.speechStartTime = 0;
        this.highlightingTimer = null;
        this.nextSentenceTimeout = null;
        this.stateChangeTimeout = null;
        
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
        this.onSentenceStart = null;
        this.onSentenceEnd = null;

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
        
        // Set default voice (prefer Google voices for quality)
        if (!this.settings.voice && this.voices.length > 0) {
            const googleVoice = this.voices.find(voice => voice.name.includes('Google'));
            const defaultVoice = this.voices.find(voice => voice.default);
            this.settings.voice = googleVoice || defaultVoice || this.voices[0];
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

            this.currentText = text; // Store current text for highlighting calculations
            this.sentences = sentences || [];
            this.textElement = textElement;
            this.currentSentenceIndex = 0;

            if (!text || text.trim() === '') {
                throw new Error('No text provided to speak');
            }

            // Ensure voices are loaded (critical for HTTPS sites)
            if (this.voices.length === 0) {
                this.loadVoices();
                // Wait a bit for voices to load on HTTPS sites
                setTimeout(() => {
                    this.initiateSpeech(text);
                }, 100);
                return;
            }

            this.initiateSpeech(text);

        } catch (error) {
            console.error('Error starting speech:', error);
            if (this.onError) {
                this.onError(`Error starting speech: ${error.message}`);
            }
        }
    }

    /**
     * Initialize speech synthesis (separate method for better error handling)
     * @param {string} text - Text to speak
     */
    initiateSpeech(text) {
        try {
            // Create utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            this.applySettings(this.currentUtterance);

            // Set up event handlers
            this.setupUtteranceEvents();

            // For HTTPS sites, ensure speech synthesis is ready
            if (this.synth.pending || this.synth.speaking) {
                this.synth.cancel();
                // Small delay to ensure clean state
                setTimeout(() => {
                    this.startSpeechSynthesis();
                }, 50);
            } else {
                this.startSpeechSynthesis();
            }

        } catch (error) {
            console.error('Error initiating speech:', error);
            if (this.onError) {
                this.onError(`Error initiating speech: ${error.message}`);
            }
        }
    }

    /**
     * Start the actual speech synthesis
     */
    startSpeechSynthesis() {
        try {
            // Start speaking
            this.synth.speak(this.currentUtterance);
            this.isPlaying = true;
            this.isPaused = false;

            if (this.onStart) {
                this.onStart();
            }

            // Start sentence-by-sentence highlighting
            if (this.sentences.length > 0) {
                this.startSentenceHighlighting();
            }

        } catch (error) {
            console.error('Error starting speech synthesis:', error);
            if (this.onError) {
                this.onError(`Speech synthesis failed: ${error.message}. Try refreshing the page and ensure you're using Chrome browser.`);
            }
        }
    }

    /**
     * Apply current settings to utterance
     * @param {SpeechSynthesisUtterance} utterance - Utterance to configure
     */
    applySettings(utterance) {
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;
        if (this.settings.voice) {
            utterance.voice = this.settings.voice;
        }
    }

    /**
     * Set up utterance event handlers with improved state management
     */
    setupUtteranceEvents() {
        if (!this.currentUtterance) return;

        this.currentUtterance.onstart = () => {
            this.speechStartTime = Date.now();
            this.isPlaying = true;
            this.isPaused = false;
            
            // Clear any pending state changes
            if (this.stateChangeTimeout) {
                clearTimeout(this.stateChangeTimeout);
                this.stateChangeTimeout = null;
            }
            
            if (this.onStart) {
                this.onStart();
            }
        };

        this.currentUtterance.onend = () => {
            // Use timeout to handle browser inconsistencies
            this.stateChangeTimeout = setTimeout(() => {
                this.isPlaying = false;
                this.isPaused = false;
                this.clearHighlighting();
                this.clearHighlightingTimers();
                
                if (this.onEnd) {
                    this.onEnd();
                }
            }, 50);
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            
            this.stateChangeTimeout = setTimeout(() => {
                this.isPlaying = false;
                this.isPaused = false;
                this.clearHighlighting();
                this.clearHighlightingTimers();
                
                if (this.onError) {
                    this.onError(`Speech error: ${event.error}`);
                }
            }, 50);
        };

        this.currentUtterance.onpause = () => {
            this.stateChangeTimeout = setTimeout(() => {
                this.isPaused = true;
                this.clearHighlightingTimers();
                
                if (this.onPause) {
                    this.onPause();
                }
            }, 50);
        };

        this.currentUtterance.onresume = () => {
            this.stateChangeTimeout = setTimeout(() => {
                this.isPaused = false;
                
                // Restart highlighting from current position
                if (this.sentences.length > 0) {
                    this.startTimeBasedHighlighting();
                }
                
                if (this.onResume) {
                    this.onResume();
                }
            }, 50);
        };

        // Add boundary event if supported
        if ('onboundary' in this.currentUtterance) {
            this.currentUtterance.onboundary = (event) => {
                if (event.name === 'word' || event.name === 'sentence') {
                    this.updateHighlightingBasedOnPosition(event.charIndex);
                }
            };
        }
    }

    /**
     * Start sentence-by-sentence highlighting using speech boundary events
     */
    startSentenceHighlighting() {
        if (!this.sentences.length || !this.textElement) return;

        // Clear any existing timers
        this.clearHighlightingTimers();
        
        // Start with first sentence
        this.currentSentenceIndex = 0;
        this.highlightCurrentSentence();
        
        // Use speech boundary events for more accurate highlighting
        this.setupBoundaryTracking();
    }

    /**
     * Set up boundary tracking for accurate text highlighting
     */
    setupBoundaryTracking() {
        if (!this.currentUtterance || !this.sentences.length) return;

        // Try to use boundary events if supported
        if ('onboundary' in this.currentUtterance) {
            this.currentUtterance.onboundary = (event) => {
                if (event.name === 'word' || event.name === 'sentence') {
                    this.updateHighlightingBasedOnPosition(event.charIndex);
                }
            };
        } else {
            // Fallback to time-based estimation with better accuracy
            this.startTimeBasedHighlighting();
        }
    }

    /**
     * Update highlighting based on character position in speech
     * @param {number} charIndex - Current character index in speech
     */
    updateHighlightingBasedOnPosition(charIndex) {
        if (!this.sentences.length || !this.isPlaying) return;

        // Find which sentence contains this character position
        for (let i = 0; i < this.sentences.length; i++) {
            const sentence = this.sentences[i];
            if (charIndex >= sentence.startChar && charIndex <= sentence.endChar) {
                if (i !== this.currentSentenceIndex) {
                    this.currentSentenceIndex = i;
                    this.highlightCurrentSentence();
                }
                break;
            }
        }
    }

    /**
     * Fallback time-based highlighting with improved accuracy
     */
    startTimeBasedHighlighting() {
        if (!this.sentences.length || !this.textElement) return;

        const totalText = this.currentText;
        const totalWords = totalText.split(/\s+/).length;
        const estimatedDuration = (totalWords / (150 * this.settings.rate)) * 60 * 1000; // in milliseconds
        
        // More frequent updates for smoother highlighting
        const updateInterval = Math.min(500, estimatedDuration / (this.sentences.length * 2));
        
        this.highlightingTimer = setInterval(() => {
            if (!this.isPlaying || this.isPaused) {
                this.clearHighlightingTimers();
                return;
            }

            const elapsed = Date.now() - this.speechStartTime;
            const progress = elapsed / estimatedDuration;
            const targetSentenceIndex = Math.floor(progress * this.sentences.length);
            
            if (targetSentenceIndex !== this.currentSentenceIndex && targetSentenceIndex < this.sentences.length) {
                this.currentSentenceIndex = Math.max(0, Math.min(targetSentenceIndex, this.sentences.length - 1));
                this.highlightCurrentSentence();
            }
        }, updateInterval);
    }

    /**
     * Clear highlighting timers
     */
    clearHighlightingTimers() {
        if (this.highlightingTimer) {
            clearInterval(this.highlightingTimer);
            this.highlightingTimer = null;
        }
        if (this.nextSentenceTimeout) {
            clearTimeout(this.nextSentenceTimeout);
            this.nextSentenceTimeout = null;
        }
    }

    /**
     * Highlight current sentence
     */
    highlightCurrentSentence() {
        if (!this.textElement || !this.sentences.length) return;

        // Clear previous highlighting
        this.clearHighlighting();

        // Find and highlight current sentence
        const sentenceElements = this.textElement.querySelectorAll('.sentence');
        if (sentenceElements[this.currentSentenceIndex]) {
            const currentElement = sentenceElements[this.currentSentenceIndex];
            currentElement.classList.add('highlight-current');
            
            // Scroll to current sentence
            currentElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            if (this.onSentenceStart) {
                this.onSentenceStart(this.currentSentenceIndex, this.sentences[this.currentSentenceIndex]);
            }
        }

        // Mark previous sentences as spoken
        for (let i = 0; i < this.currentSentenceIndex; i++) {
            if (sentenceElements[i]) {
                sentenceElements[i].classList.add('highlight-spoken');
            }
        }

        // Update progress
        if (this.onProgress) {
            const progress = ((this.currentSentenceIndex + 1) / this.sentences.length) * 100;
            this.onProgress(`Speaking sentence ${this.currentSentenceIndex + 1} of ${this.sentences.length}`, progress);
        }
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
     * Pause speech with better state management
     */
    pause() {
        if (this.isPlaying && !this.isPaused && this.synth.speaking) {
            this.synth.pause();
            // Don't set isPaused here immediately - let the event handler do it
            // This prevents race conditions
        }
    }

    /**
     * Resume speech with better state management
     */
    resume() {
        if (this.isPaused && this.synth.paused) {
            this.synth.resume();
            // Don't set isPaused here immediately - let the event handler do it
            // This prevents race conditions
        }
    }

    /**
     * Stop speech with improved cleanup
     */
    stop() {
        // Clear all timers first
        this.clearHighlightingTimers();
        
        if (this.stateChangeTimeout) {
            clearTimeout(this.stateChangeTimeout);
            this.stateChangeTimeout = null;
        }
        
        // Cancel speech synthesis
        if (this.synth.speaking || this.synth.pending) {
            this.synth.cancel();
        }
        
        // Reset state immediately for responsive UI
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSentenceIndex = 0;
        this.speechStartTime = 0;
        this.currentText = '';
        
        // Clear highlighting
        this.clearHighlighting();
        
        // Clean up utterance
        if (this.currentUtterance) {
            this.currentUtterance.onstart = null;
            this.currentUtterance.onend = null;
            this.currentUtterance.onerror = null;
            this.currentUtterance.onpause = null;
            this.currentUtterance.onresume = null;
            if ('onboundary' in this.currentUtterance) {
                this.currentUtterance.onboundary = null;
            }
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

    /**
     * Set callback for sentence start
     * @param {Function} callback - Sentence start callback function
     */
    setSentenceStartCallback(callback) {
        this.onSentenceStart = callback;
    }

    /**
     * Set callback for sentence end
     * @param {Function} callback - Sentence end callback function
     */
    setSentenceEndCallback(callback) {
        this.onSentenceEnd = callback;
    }
}

// Export for use in other modules
window.SpeechController = SpeechController;
