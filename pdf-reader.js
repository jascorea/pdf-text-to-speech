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

            if (this.onProgress) {
                this.onProgress('Loading PDF...', 0);
            }

            // Read file
            const arrayBuffer = await this.readFile(pdfFile);
            
            // Load PDF document
            this.pdfDocument = await pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                cMapPacked: true
            }).promise;
            
            if (this.onProgress) {
                this.onProgress('Extracting text...', 50);
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
            console.error('PDF loading failed:', error);
            if (this.onError) {
                this.onError(`Failed to load PDF: ${error.message}`);
            }
        }
    }

    /**
     * Read file as ArrayBuffer
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} - File content as ArrayBuffer
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            
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
                    const progress = 50 + ((pageNum - 1) / numPages) * 50;
                    this.onProgress(`Processing page ${pageNum} of ${numPages}...`, progress);
                }

                const page = await this.pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Extract text items
                const pageText = textContent.items.map(item => item.str).join(' ');
                
                if (pageText.trim()) {
                    textParts.push(pageText);
                }
                
            } catch (error) {
                console.warn(`Error extracting text from page ${pageNum}:`, error);
            }
        }

        // Combine all text
        this.extractedText = textParts.join('\n\n').trim();
        
        // Process text into sentences
        this.processSentences();
    }

    /**
     * Process text into sentences for better speech synthesis
     */
    processSentences() {
        if (!this.extractedText) {
            this.sentences = [];
            return;
        }

        // Clean text first
        const cleanText = this.extractedText
            .replace(/\s+/g, ' ')
            .trim();

        // Split into sentences
        const sentenceEnders = /[.!?]+\s*/g;
        const rawSentences = cleanText.split(sentenceEnders);
        
        this.sentences = rawSentences
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 0)
            .map((sentence, index) => ({
                id: index,
                text: sentence,
                startChar: 0,
                endChar: sentence.length,
                element: null
            }));

        // Calculate character positions
        let charPosition = 0;
        this.sentences.forEach(sentence => {
            sentence.startChar = charPosition;
            sentence.endChar = charPosition + sentence.text.length;
            charPosition += sentence.text.length + 1;
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
