# 🇱🇰 PayCheck.lk - Sri Lankan Bank Receipt Verifier & OCR

A modern, fast, and privacy-first web application designed for Sri Lankan businesses, freelancers, accountants, and merchants to verify, extract, and organize bank payment slips and transfer advices.

All OCR image recognition runs **100% locally in your web browser** using Tesseract.js — no sensitive banking documents or transaction slips are uploaded to external third-party OCR servers.

![PayCheck.lk Banner](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

- **Drag & Drop Upload:** Accepts receipt slips in **JPG, JPEG, PNG, and PDF** formats.
- **Client-Side OCR Engine:** Powered by Tesseract.js and PDF.js directly within the user's browser.
- **Smart Sri Lankan Bank Detection:** Pre-tuned regex & keyword parsing rules for:
  - 🔵 **Commercial Bank of Ceylon (COMBANK)** (e-Slips, Online Banking advices, Trace/Ref numbers)
  - 🟡 **Bank of Ceylon (BOC)** (SmartPay, FT sequence numbers, E-Receipts)
  - 🟠 **Sampath Bank (Vishwa)** (CEFT transaction references, payment slips)
  - 🟢 **National Savings Bank (NSB)** (Deposit vouchers, Journal/Receipt numbers)
  - 🔴 **People's Bank (People's Wave)** (Wave payment references, transaction IDs)
  - 💠 **Hatton National Bank (HNB)** (Digital receipts, host references, MOMO/Solo)
  - ⚪ **Other / Custom Banks**
- **Automated Field Extraction:** Automatically extracts:
  - Total / Transfer Amount in Sri Lankan Rupees (LKR / Rs.)
  - Transaction Date & Time
  - Reference / Transaction ID / Trace No
  - Bank Name & Code
  - Sender & Beneficiary Accounts / Names
- **Verification & Editing Modal:** Review extracted data alongside an interactive preview of the original receipt slip before saving.
- **Duplicate Reference Alert:** Automatically warns if a transaction reference number already exists in your records to prevent double-crediting.
- **Bilingual Interface (English + සිංහල):** Instant one-click toggle between English and Sinhala with full translations.
- **Data Persistence:** All records are stored locally in your browser's `localStorage` with offline support.
- **Export Options:**
  - 📊 **Export to CSV:** UTF-8 formatted CSV with Rupee formatting and full metadata.
  - 📈 **Export to Google Sheets:** Direct integration with Google Sheets REST API to automatically create and append receipt records.
  - 🌐 **Single-File Standalone Edition:** Includes a standalone `single-file/index.html` file that can be opened locally in any browser with zero installation.

---

## 🚀 Step-by-Step Instructions to Push to Your GitHub

Follow these simple steps in your terminal to publish this project to your GitHub account:

### Step 1: Create a New GitHub Repository
1. Log in to [GitHub](https://github.com) and go to [github.com/new](https://github.com/new).
2. Set the repository name to `paycheck-lk`.
3. Choose **Public** (or Private).
4. **Do not** check "Add a README file" (as this repository already has one).
5. Click **Create repository**.

### Step 2: Initialize Git and Commit
Open your terminal in the root directory of this project and run:

```bash
# Initialize local git repository
git init

# Stage all files
git add .

# Create your first commit
git commit -m "Initial commit: PayCheck.lk Sri Lankan Receipt Verifier"
```

### Step 3: Link to Your GitHub Repository
Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
# Rename default branch to main
git branch -M main

# Add your GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/paycheck-lk.git
```

### Step 4: Push to GitHub
```bash
git push -u origin main
```

---

## ⚡ GitHub Pages Auto-Deployment

This repository comes pre-configured with a GitHub Actions workflow located at:
`.github/workflows/deploy.yml`

Whenever you push changes to the `main` branch, the workflow will automatically:
1. Check out your code
2. Install dependencies with `npm ci`
3. Build the production web application using Vite (`npm run build`)
4. Deploy the compiled assets to the `gh-pages` branch

### Enabling GitHub Pages in Your Repository:
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - **Source:** Select **Deploy from a branch**.
   - **Branch:** Select `gh-pages` and `/ (root)`.
   - Click **Save**.
4. Within 1-2 minutes, your live site will be accessible at:
   `https://YOUR_USERNAME.github.io/paycheck-lk/`

---

## 💻 Local Development Setup

To run this application locally on your computer:

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/paycheck-lk.git
cd paycheck-lk

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Available Scripts:
- `npm run dev`: Starts the Vite development server on port 3000.
- `npm run build`: Compiles production assets into the `dist/` folder.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs TypeScript validation checks (`tsc --noEmit`).

---

## 📁 Repository Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages auto-deploy workflow
├── single-file/
│   └── index.html              # 100% self-contained standalone HTML edition
├── src/
│   ├── components/
│   │   ├── DropZone.tsx        # Drag & drop upload area with sample receipts
│   │   ├── GitHubGuideModal.tsx# In-app interactive GitHub push guide
│   │   ├── GoogleSheetsModal.tsx# Google Sheets export with auth & confirmation
│   │   ├── Header.tsx          # Bilingual header, brand & Google login
│   │   ├── ImagePreviewModal.tsx# High-resolution receipt image viewer
│   │   ├── ReceiptEditor.tsx   # Verification and field editing modal
│   │   ├── ReceiptsTable.tsx   # Verified receipts table with search & filters
│   │   └── StatsOverview.tsx   # Overview metrics cards
│   ├── constants/
│   │   ├── banks.ts            # Sri Lankan bank configs, colors & sample slips
│   │   └── translations.ts     # Complete English & Sinhala dictionary
│   ├── services/
│   │   ├── auth.ts             # Firebase Auth with in-memory OAuth token caching
│   │   ├── extractor.ts        # Sri Lankan bank regex & parsing logic
│   │   ├── googleSheets.ts     # Google Sheets REST API integration
│   │   ├── ocr.ts              # Tesseract.js worker & PDF.js page rendering
│   │   └── storage.ts          # LocalStorage management and CSV exporter
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces & types
│   ├── App.tsx                 # Root application component
│   ├── index.css               # Global Tailwind CSS imports
│   └── main.tsx                # React DOM entry point
├── index.html                  # Main HTML entry point
├── metadata.json               # Application metadata
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

---

## 🔒 Privacy & Security

- **Zero Server Uploads for OCR:** All image and PDF OCR operations are executed strictly client-side within the browser.
- **In-Memory Token Cache:** OAuth access tokens for Google Sheets are cached only in memory during the active session and are never saved to localStorage or sessionStorage.
- **Destructive Operation Protection:** Confirmation prompts are enforced before overwriting data or clearing records.

---

## 📄 License

Apache License 2.0. Open-source and free to customize for personal or commercial use.
