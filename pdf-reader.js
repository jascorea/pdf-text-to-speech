/**
 * PDF Reader Module
 * Handles PDF file loading and text extraction using PDF.js
 */

class PDFReader {
    constructor() {
        this.pdfDocument = null;
        this.extractedText = '';
        this.sentences = [];
        this.onTextExtracted = null;
        this.onError = null;
        this.onProgress = null;
        
        // Configure PDF.js worker with fallback for HTTPS sites
        if (typeof pdfjsLib !== 'undefined') {
            this.configurePDFWorker();
        }
    }

    /**
     * Configure PDF.js worker with fallbacks for HTTPS sites
     */
    configurePDFWorker() {
        try {
            // Primary CDN
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Test if worker loads, set up fallback
            const testWorker = new Worker(pdfjsLib.GlobalWorkerOptions.workerSrc);
            testWorker.terminate();
        } catch (error) {
            console.warn('Primary PDF worker failed, using fallback:', error);
            // Fallback CDN
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
    }

    /**
     * Load and process PDF file with retry logic for reliability
     * @param {File} pdfFile - The PDF file to process
     */
    async loadPDF(pdfFile) {
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!pdfFile || pdfFile.type !== 'application/pdf') {
                    throw new Error('Please select a valid PDF file');
                }

                // Show loading state
                if (this.onProgress) {
                    const retryText = attempt > 1 ? ` (Attempt ${attempt}/${maxRetries})` : '';
                    this.onProgress(`Loading PDF...${retryText}`, 0);
                }

                // Ensure worker is configured before each attempt
                if (attempt > 1) {
                    this.configurePDFWorker();
                    // Small delay between retries
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const arrayBuffer = await this.readFileWithRetry(pdfFile);
                
                // Load PDF document with enhanced configuration
                this.pdfDocument = await pdfjsLib.getDocument({
                    data: arrayBuffer,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
                    useSystemFonts: false, // Better compatibility on HTTPS
                    verbosity: 0 // Reduce console noise
                }).promise;
                
                if (this.onProgress) {
                    this.onProgress('Extracting text...', 0);
                }

                // Extract text from all pages
                await this.extractAllText();
                
                if (this.onProgress) {
                    this.onProgress('Processing complete', 100);
                }

                // Callback with extracted text
                if (this.onTextExtracted) {
                    this.onTextExtracted(this.extractedText, this.sentences);
                }

                // Success - break out of retry loop
                return;

            } catch (error) {
                console.warn(`PDF loading attempt ${attempt} failed:`, error);
                lastError = error;

                if (attempt === maxRetries) {
                    // Final attempt failed
                    console.error('All PDF loading attempts failed:', lastError);
                    if (this.onError) {
                        this.onError(`Failed to load PDF after ${maxRetries} attempts. Please try again or use a different PDF file. Error: ${lastError.message}`);
                    }
                } else {
                    // Will retry
                    if (this.onProgress) {
                        this.onProgress(`Loading failed, retrying... (${attempt}/${maxRetries})`, 0);
                    }
                }
            }
        }
    }

    /**
     * Read file with retry logic for better reliability
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} - File content as ArrayBuffer
     */
    async readFileWithRetry(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                resolve(reader.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read PDF file'));
            };
            
            reader.onabort = () => {
                reject(new Error('File reading was aborted'));
            };
            
            // Read file as ArrayBuffer
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract text from all pages of the PDF
     */
    async extractAllText() {
        const numPages = this.pdfDocument.numPages;
        const textParts = [];
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
                if (this.onProgress) {
                    const progress = ((pageNum - 1) / numPages) * 100;
                    this.onProgress(`Processing page ${pageNum} of ${numPages}...`, progress);
                }

                const page = await this.pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Extract text items and preserve spacing
                const pageText = this.processTextContent(textContent);
                
                if (pageText.trim()) {
                    textParts.push(pageText);
                }
                
            } catch (error) {
                console.warn(`Error extracting text from page ${pageNum}:`, error);
                // Continue with other pages even if one fails
            }
        }

        // Combine all text
        this.extractedText = textParts.join('\n\n').trim();
        
        // Process text into sentences for better speech synthesis
        this.processSentences();
    }

    /**
     * Process PDF.js text content to preserve formatting
     * @param {Object} textContent - PDF.js text content object
     * @returns {string} - Processed text
     */
    processTextContent(textContent) {
        const textItems = textContent.items;
        let text = '';
        let lastY = null;
        let lastX = null;

        textItems.forEach((item, index) => {
            const currentY = item.transform[5];
            const currentX = item.transform[4];
            
            // Add line breaks for new lines (different Y position)
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                text += '\n';
            }
            // Add spaces for significant horizontal gaps
            else if (lastX !== null && currentX - lastX > 20) {
                text += ' ';
            }
            
            text += item.str;
            lastY = currentY;
            lastX = currentX + (item.width || 0);
        });

        return this.cleanText(text);
    }

    /**
     * Clean and format extracted text
     * @param {string} text - Raw extracted text
     * @returns {string} - Cleaned text
     */
    cleanText(text) {
        return text
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Fix broken words at line breaks
            .replace(/(\w)-\s+(\w)/g, '$1$2')
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            // Remove leading/trailing whitespace
            .trim();
    }

    /**
     * Process text into sentences for better speech synthesis
     */
    processSentences() {
        if (!this.extractedText) {
            this.sentences = [];
            return;
        }

        // Split text into sentences using multiple delimiters
        const sentenceEnders = /[.!?]+\s*/g;
        const rawSentences = this.extractedText.split(sentenceEnders);
        
        this.sentences = rawSentences
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 0)
            .map((sentence, index) => ({
                id: index,
                text: sentence,
                startChar: 0, // Will be calculated later
                endChar: 0,   // Will be calculated later
                element: null // Will store DOM element reference
            }));

        // Calculate character positions
        let charPosition = 0;
        this.sentences.forEach(sentence => {
            sentence.startChar = charPosition;
            sentence.endChar = charPosition + sentence.text.length;
            charPosition += sentence.text.length + 1; // +1 for sentence delimiter
        });
    }

    /**
     * Get text for display with sentence markers
     * @returns {string} - Text formatted for display
     */
    getFormattedText() {
        if (!this.sentences.length) {
            return this.extractedText;
        }

        return this.sentences
            .map(sentence => `<span class="sentence" data-sentence-id="${sentence.id}">${sentence.text}</span>`)
            .join(' ');
    }

    /**
     * Get sentence by ID
     * @param {number} sentenceId - ID of the sentence
     * @returns {Object|null} - Sentence object or null
     */
    getSentence(sentenceId) {
        return this.sentences.find(s => s.id === sentenceId) || null;
    }

    /**
     * Get all sentences
     * @returns {Array} - Array of sentence objects
     */
    getAllSentences() {
        return this.sentences;
    }

    /**
     * Get plain text without formatting
     * @returns {string} - Plain text
     */
    getPlainText() {
        return this.extractedText;
    }

    /**
     * Clear loaded PDF and extracted text
     */
    clear() {
        this.pdfDocument = null;
        this.extractedText = '';
        this.sentences = [];
    }

    /**
     * Set callback for text extraction completion
     * @param {Function} callback - Callback function
     */
    setTextExtractedCallback(callback) {
        this.onTextExtracted = callback;
    }

    /**
     * Set callback for error handling
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
     * Check if PDF.js is available
     * @returns {boolean} - True if PDF.js is loaded
     */
    isPDFJSAvailable() {
        return typeof pdfjsLib !== 'undefined';
    }
}

// Export for use in other modules
window.PDFReader = PDFReader;
