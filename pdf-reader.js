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
        
        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Load and process PDF file
     * @param {File} pdfFile - The PDF file to process
     */
    async loadPDF(pdfFile) {
        try {
            if (!pdfFile || pdfFile.type !== 'application/pdf') {
                throw new Error('Please select a valid PDF file');
            }

            // Show loading state
            if (this.onProgress) {
                this.onProgress('Loading PDF...', 0);
            }

            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Load PDF document
            this.pdfDocument = await pdfjsLib.getDocument(arrayBuffer).promise;
            
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

        } catch (error) {
            console.error('Error loading PDF:', error);
            if (this.onError) {
                this.onError(`Error loading PDF: ${error.message}`);
            }
        }
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
