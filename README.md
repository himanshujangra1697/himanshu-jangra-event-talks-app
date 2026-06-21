# BigQuery Release Notes Tracker & Tweet Companion

A modern, high-fidelity web application built with Python Flask and plain vanilla HTML, JavaScript, and CSS that fetches the Google Cloud BigQuery Release Notes, categorizes them, and provides a sleek environment to draft and share tweets on X (Twitter).

---

## 🌟 Features

*   **Categorized Update Cards**: Parses and decomposes daily Google Cloud announcements into specific individual update cards (`Feature`, `Issue`, `Fixed`, `Deprecation`, `Changed`).
*   **Dynamic Search & Filtering**: Type queries to filter updates instantly or toggle category chips to isolate specific kinds of release items.
*   **Background Syncing**: A simple, animated refresh button fetches the latest feed updates asynchronously with skeleton shimmer states during loading.
*   **Interactive Tweet Composer**: Click on any update card to open the tweet workspace, pre-filling details using customizable draft styles.
*   **Automated Character Limits**: Dynamically checks character boundaries for X (Twitter). If a post exceeds 280 characters, the description is automatically truncated to keep hashtags and references valid.
*   **Live Sandbox Preview**: Renders a dark-themed simulation of how the tweet wraps and formats.
*   **One-Click Publishing**: Instantly share your drafted post on X via Web Intents or copy it directly to your clipboard.

---

## 🛠️ Technology Stack

*   **Backend**: Python 3, Flask, `feedparser`, `beautifulsoup4`
*   **Frontend**: Vanilla HTML5, CSS3, ES6 JavaScript
*   **Integration**: Twitter/X Web Intent API

---

## 🚀 Getting Started

### Prerequisites
Make sure Python 3.8+ is installed on your system.

### 1. Installation
Clone the repository and install the Python dependencies:

```bash
pip install flask feedparser beautifulsoup4
```

### 2. Running the Application
Launch the Flask development server:

```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📁 Project Structure

```text
bq-releases-notes/
├── app.py                 # Flask server, Atom feed parsing logic
├── templates/
│   └── index.html         # Main page skeleton and composer layouts
├── static/
│   ├── css/
│   │   └── styles.css     # Dark layout colors, loaders, & animations
│   └── js/
│       └── app.js         # State controller, search filter, tweet logic
└── .gitignore             # Ignored compilation files & environment vars
```

---

## 📄 License

This project is licensed under the MIT License.
