/**
 * Main Application Script
 * Coordinates PDF reading, speech synthesis, and UI interactions
 */

class TextToSpeechApp {
    constructor() {
        // Initialize components
        this.pdfReader = new PDFReader();
        this.speechController = new SpeechController();
        
        // Application state
        this.currentText = '';
        this.currentSentences = [];
        this.isTextLoaded = false;
        
        // UI elements
        this.initializeElements();
        this.setupEventListeners();
        this.setupCallbacks();
        
        // Initialize UI state
        this.updateUI();
        this.loadVoices();
        
        console.log('PDF Text-to-Speech Reader initialized');
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // File upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.pdfInput = document.getElementById('pdfInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.removeFileBtn = document.getElementById('removeFile');
        
        // Control elements
        this.controlsSection = document.getElementById('controlsSection');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // Voice control elements
        this.speedControl = document.getElementById('speedControl');
        this.speedValue = document.getElementById('speedValue');
        this.pitchControl = document.getElementById('pitchControl');
        this.pitchValue = document.getElementById('pitchValue');
        this.voiceSelect = document.getElementById('voiceSelect');
        
        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Text display elements
        this.textSection = document.getElementById('textSection');
        this.textContainer = document.getElementById('textContainer');
        this.extractedText = document.getElementById('extractedText');
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.pdfInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        this.pdfInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.removeFileBtn.addEventListener('click', this.clearFile.bind(this));
        
        // Playback control events
        this.playBtn.addEventListener('click', this.play.bind(this));
        this.pauseBtn.addEventListener('click', this.pause.bind(this));
        this.stopBtn.addEventListener('click', this.stop.bind(this));
        
        // Voice control events
        this.speedControl.addEventListener('input', this.updateSpeed.bind(this));
        this.pitchControl.addEventListener('input', this.updatePitch.bind(this));
        this.voiceSelect.addEventListener('change', this.updateVoice.bind(this));
        
        // Prevent default drag behaviors on the document
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', e => e.preventDefault());
    }

    /**
     * Set up callbacks for PDF reader and speech controller
     */
    setupCallbacks() {
        // PDF Reader callbacks
        this.pdfReader.setTextExtractedCallback(this.onTextExtracted.bind(this));
        this.pdfReader.setErrorCallback(this.showError.bind(this));
        this.pdfReader.setProgressCallback(this.updateProgress.bind(this));
        
        // Speech Controller callbacks
        this.speechController.setStartCallback(this.onSpeechStart.bind(this));
        this.speechController.setEndCallback(this.onSpeechEnd.bind(this));
        this.speechController.setPauseCallback(this.onSpeechPause.bind(this));
        this.speechController.setResumeCallback(this.onSpeechResume.bind(this));
        this.speechController.setErrorCallback(this.showError.bind(this));
        this.speechController.setProgressCallback(this.updateProgress.bind(this));
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    /**
     * Handle file drop event
     */
    handleFileDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Handle file selection event
     */
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Process uploaded PDF file
     */
    processFile(file) {
        if (!file) return;

        if (file.type !== 'application/pdf') {
            this.showError('Please select a valid PDF file');
            return;
        }

        // Show file info
        this.fileName.textContent = file.name;
        this.fileInfo.style.display = 'flex';
        this.uploadArea.style.display = 'none';
        
        // Clear previous content
        this.clearText();
        
        // Load PDF
        this.pdfReader.loadPDF(file);
    }

    /**
     * Clear uploaded file
     */
    clearFile() {
        // Reset file input
        this.pdfInput.value = '';
        
        // Hide file info and show upload area
        this.fileInfo.style.display = 'none';
        this.uploadArea.style.display = 'block';
        
        // Clear content
        this.clearText();
        this.pdfReader.clear();
        
        // Update UI
        this.updateUI();
    }

    /**
     * Clear extracted text and reset UI
     */
    clearText() {
        this.currentText = '';
        this.currentSentences = [];
        this.isTextLoaded = false;
        this.extractedText.innerHTML = '';
        this.textSection.style.display = 'none';
        this.controlsSection.style.display = 'none';
        this.speechController.stop();
    }

    /**
     * Handle text extraction completion
     */
    onTextExtracted(text, sentences) {
        this.currentText = text;
        this.currentSentences = sentences;
        this.isTextLoaded = true;
        
        // Display text
        this.displayText();
        
        // Show controls and text sections
        this.controlsSection.style.display = 'block';
        this.textSection.style.display = 'block';
        
        // Update UI
        this.updateUI();
        this.updateProgress('Ready to play', 0);
        
        console.log(`Text extracted: ${text.length} characters, ${sentences.length} sentences`);
    }

    /**
     * Display extracted text in the UI
     */
    displayText() {
        if (!this.currentText) return;
        
        // Use formatted text with sentence markers for highlighting
        const formattedText = this.pdfReader.getFormattedText();
        this.extractedText.innerHTML = formattedText;
    }

    /**
     * Play text-to-speech
     */
    play() {
        if (!this.isTextLoaded || !this.currentText) {
            this.showError('Please upload and process a PDF file first');
            return;
        }

        if (this.speechController.isPausedState()) {
            // Resume if paused
            this.speechController.resume();
        } else {
            // Start new speech
            this.speechController.speak(
                this.currentText,
                this.currentSentences,
                this.extractedText
            );
        }
    }

    /**
     * Pause text-to-speech
     */
    pause() {
        this.speechController.pause();
    }

    /**
     * Stop text-to-speech
     */
    stop() {
        this.speechController.stop();
    }

    /**
     * Update speech speed
     */
    updateSpeed() {
        const speed = parseFloat(this.speedControl.value);
        this.speechController.setRate(speed);
        this.speedValue.textContent = `${speed.toFixed(1)}x`;
    }

    /**
     * Update speech pitch
     */
    updatePitch() {
        const pitch = parseFloat(this.pitchControl.value);
        this.speechController.setPitch(pitch);
        this.pitchValue.textContent = pitch.toFixed(1);
    }

    /**
     * Update selected voice
     */
    updateVoice() {
        const voiceName = this.voiceSelect.value;
        if (voiceName) {
            this.speechController.setVoiceByName(voiceName);
        }
    }

    /**
     * Load and populate voice options
     */
    loadVoices() {
        const populateVoices = () => {
            const voices = this.speechController.getVoices();
            this.voiceSelect.innerHTML = '';
            
            if (voices.length === 0) {
                this.voiceSelect.innerHTML = '<option value="">No voices available</option>';
                return;
            }

            // Add default option
            this.voiceSelect.innerHTML = '<option value="">Default Voice</option>';
            
            // Add available voices
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                
                // Mark Google voices as high quality
                if (voice.name.includes('Google')) {
                    option.textContent += ' ⭐';
                }
                
                this.voiceSelect.appendChild(option);
            });
            
            // Select the current voice
            const currentVoice = this.speechController.getSettings().voice;
            if (currentVoice) {
                this.voiceSelect.value = currentVoice.name;
            }
        };

        // Populate voices immediately
        populateVoices();
        
        // Also listen for voice changes (some browsers load voices asynchronously)
        setTimeout(populateVoices, 100);
        setTimeout(populateVoices, 1000);
    }

    /**
     * Handle speech start
     */
    onSpeechStart() {
        this.updateUI();
        this.updateProgress('Speaking...', 0);
    }

    /**
     * Handle speech end
     */
    onSpeechEnd() {
        this.updateUI();
        this.updateProgress('Finished', 100);
    }

    /**
     * Handle speech pause
     */
    onSpeechPause() {
        this.updateUI();
        this.updateProgress('Paused', null);
    }

    /**
     * Handle speech resume
     */
    onSpeechResume() {
        this.updateUI();
        this.updateProgress('Speaking...', null);
    }

    /**
     * Update UI button states
     */
    updateUI() {
        const isPlaying = this.speechController.isSpeaking();
        const isPaused = this.speechController.isPausedState();
        const hasText = this.isTextLoaded;
        
        // Enable/disable buttons based on state
        this.playBtn.disabled = !hasText || isPlaying;
        this.pauseBtn.disabled = !isPlaying;
        this.stopBtn.disabled = !isPlaying && !isPaused;
        
        // Update button appearance
        if (isPlaying) {
            this.playBtn.classList.remove('primary');
            this.pauseBtn.classList.add('primary');
        } else {
            this.playBtn.classList.add('primary');
            this.pauseBtn.classList.remove('primary');
        }
    }

    /**
     * Update progress display
     */
    updateProgress(message, percentage) {
        this.progressText.textContent = message;
        
        if (percentage !== null) {
            this.progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Application error:', message);
        
        // Update progress with error message
        this.updateProgress(`Error: ${message}`, 0);
        
        // You could also show a toast notification or modal here
        // For now, we'll just log it and show in progress text
        
        // Reset progress after a delay
        setTimeout(() => {
            if (this.progressText.textContent.startsWith('Error:')) {
                this.updateProgress('Ready', 0);
            }
        }, 5000);
    }

    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        const issues = [];
        
        if (!this.pdfReader.isPDFJSAvailable()) {
            issues.push('PDF.js library not available');
        }
        
        if (!this.speechController.isSupported()) {
            issues.push('Speech Synthesis not supported');
        }
        
        if (issues.length > 0) {
            this.showError(`Compatibility issues: ${issues.join(', ')}`);
            return false;
        }
        
        return true;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in a supported browser
    if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
        const app = new TextToSpeechApp();
        
        // Check compatibility
        if (!app.checkCompatibility()) {
            console.warn('Some features may not work properly in this browser');
        }
        
        // Make app available globally for debugging
        window.ttsApp = app;
    } else {
        console.warn('This application works best when served over HTTP/HTTPS');
    }
});

// Handle page visibility changes to manage speech
document.addEventListener('visibilitychange', () => {
    if (window.ttsApp && document.hidden) {
        // Optionally pause speech when page becomes hidden
        // window.ttsApp.pause();
    }
});
