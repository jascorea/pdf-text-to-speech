# PDF Text-to-Speech Reader

A web application that converts PDF documents to speech with customizable voice settings and real-time text highlighting.

## 🎯 Features

- **PDF Text Extraction**: Upload and extract text from PDF files
- **Voice Customization**: Adjust speed (0.5x - 2.0x) and pitch (0.5 - 2.0)
- **Voice Selection**: Choose from available system voices
- **Real-time Highlighting**: Text highlights as it's being spoken
- **Playback Controls**: Play, pause, and stop functionality
- **Mobile Friendly**: Responsive design that works on phones and tablets

## 🚀 Live Demo

Visit the live application: [PDF Text-to-Speech Reader](https://yourusername.github.io/pdf-text-to-speech)

## 📱 How to Use

1. **Upload a PDF**: Click "Choose PDF File" or drag and drop a PDF document
2. **Adjust Settings**: Use the sliders to set your preferred speed and pitch
3. **Select Voice**: Choose from available voices in the dropdown menu
4. **Start Reading**: Click the Play button to begin text-to-speech
5. **Follow Along**: Watch as the text highlights in real-time during speech

## 🔧 Technical Details

### Built With
- **Vanilla JavaScript** - Core functionality
- **PDF.js** - PDF text extraction
- **Web Speech API** - Text-to-speech synthesis
- **CSS3** - Modern styling and animations
- **HTML5** - Semantic structure

### Browser Compatibility
- ✅ **Chrome/Chromium** (Recommended - best voice quality)
- ✅ **Safari** (iOS/macOS)
- ✅ **Firefox** (Limited voice options)
- ✅ **Edge** (Windows)

### File Structure
```
├── index.html          # Main application structure
├── styles.css          # Styling and animations
├── script.js           # Main application logic
├── pdf-reader.js       # PDF processing module
├── speech-controller.js # Speech synthesis controller
└── README.md           # This file
```

## 🌟 Key Features Explained

### PDF Text Extraction
- Uses PDF.js library for reliable text extraction
- Intelligent sentence parsing for natural speech flow
- Preserves document structure and formatting

### Speech Synthesis
- Web Speech API integration
- Real-time text highlighting synchronized with speech
- Customizable voice parameters (speed, pitch, voice selection)
- Robust error handling and browser compatibility

### User Interface
- Clean, modern design with gradient backgrounds
- Drag-and-drop file upload
- Real-time progress indicators
- Mobile-responsive layout

## 🐛 Bug Fixes

### Recent Improvements
- **Fixed text highlighting synchronization** - Now uses speech boundary events and improved time-based calculations
- **Fixed button state management** - Resolved issues with play/pause/stop buttons getting stuck
- **Enhanced mobile compatibility** - Better touch interactions and responsive design

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements!

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Note**: This application works best in Chrome/Chromium browsers due to superior speech synthesis capabilities.
