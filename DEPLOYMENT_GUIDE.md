# 🚀 GitHub Pages Deployment Guide

Follow these steps to deploy your PDF Text-to-Speech Reader to GitHub Pages so you can access it from your phone!

## 📋 Prerequisites

- A GitHub account (create one at [github.com](https://github.com) if you don't have one)
- Your project files ready (you have them all in this folder)

## 🔧 Step-by-Step Deployment

### Step 1: Create a New GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Name your repository**: `pdf-text-to-speech` (or any name you prefer)
5. **Make it Public** (required for free GitHub Pages)
6. **Check "Add a README file"** (optional - we already have one)
7. **Click "Create repository"**

### Step 2: Upload Your Files

**Option A: Using GitHub Web Interface (Easier)**
1. **In your new repository**, click "uploading an existing file"
2. **Drag and drop ALL these files** from your project folder:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `pdf-reader.js`
   - `speech-controller.js`
   - `README.md`
3. **Write a commit message**: "Initial upload of PDF Text-to-Speech app"
4. **Click "Commit changes"**

**Option B: Using Git Commands (If you prefer terminal)**
```bash
# Clone your repository
git clone https://github.com/YOURUSERNAME/pdf-text-to-speech.git
cd pdf-text-to-speech

# Copy your files into the repository folder
# Then commit and push
git add .
git commit -m "Initial upload of PDF Text-to-Speech app"
git push origin main
```

### Step 3: Enable GitHub Pages

1. **In your repository**, click on **"Settings"** tab
2. **Scroll down** to the **"Pages"** section in the left sidebar
3. **Under "Source"**, select **"Deploy from a branch"**
4. **Choose "main"** branch
5. **Select "/ (root)"** folder
6. **Click "Save"**

### Step 4: Get Your Live URL

1. **GitHub will show you a message**: "Your site is published at..."
2. **Your URL will be**: `https://YOURUSERNAME.github.io/pdf-text-to-speech`
3. **It may take a few minutes** for the site to become available

## 📱 Accessing on Your Phone

### For the Best Mobile Experience:

1. **Open your phone's browser** (Chrome recommended)
2. **Navigate to your GitHub Pages URL**
3. **Add to Home Screen** (optional but recommended):
   - **iPhone**: Safari → Share button → "Add to Home Screen"
   - **Android**: Chrome → Menu (⋮) → "Add to Home Screen"

## 🔄 Making Updates

When you want to update your app:

1. **Make changes** to your local files
2. **Upload the updated files** to GitHub (replace the old ones)
3. **GitHub Pages will automatically update** within a few minutes

## ✅ Verification Checklist

- [ ] Repository created and is public
- [ ] All 6 files uploaded successfully
- [ ] GitHub Pages enabled from Settings
- [ ] Can access the URL from a browser
- [ ] Application works on your phone

## 🐛 Troubleshooting

### Common Issues:

**"Page not found" error:**
- Wait 5-10 minutes - GitHub Pages deployment takes time
- Check that your repository is public
- Verify GitHub Pages is enabled in Settings

**App doesn't work on phone:**
- Try Chrome browser on your phone (best compatibility)
- Check that all files uploaded correctly
- Look for any missing files in the repository

**Files didn't upload:**
- Make sure file names match exactly (case-sensitive)
- Try uploading one file at a time if bulk upload fails

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Permanent URL** accessible from any device
- ✅ **No server required** on your laptop
- ✅ **Mobile-optimized** PDF text-to-speech reader
- ✅ **Free hosting** forever on GitHub Pages

Your app will be live at: `https://YOURUSERNAME.github.io/pdf-text-to-speech`

## 🔗 Next Steps (Optional)

- **Custom Domain**: You can add your own domain name in GitHub Pages settings
- **PWA Features**: I can help make it work like a native mobile app
- **Enhanced Mobile UI**: Further optimize for touch interactions

---

**Need Help?** If you run into any issues, let me know and I'll help troubleshoot!
