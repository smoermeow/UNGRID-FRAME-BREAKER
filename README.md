# UnGrid // Frame Breaker

> **Vibe coded with Gemini Pro 3 in Google AI Studio**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-experimental-orange)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Gemini%20Pro%20Vision%20%7C%20TypeScript-green)

**UnGrid** is an experimental web application designed to deconstruct grid-based AI image compositions (such as 3x3 character sheets or 2x2 storyboard generations) into individual, high-fidelity panels.

## 🧪 The Architecture: Dual-Model Pipeline

This project demonstrates a specialized "Hybrid AI Pipeline" to balance latency with visual fidelity. Instead of using a single model for everything, UnGrid orchestrates two distinct Gemini models:

### 1. The Eye: Gemini 2.5 Flash
*   **Model ID:** `gemini-2.5-flash`
*   **Role:** Layout Detection & Analysis.
*   **Function:** When utilizing "Auto-Detect" mode, this lightweight, low-latency model analyzes the uploaded image to return specific JSON bounding boxes (`ymin`, `xmin`, `ymax`, `xmax`) for every panel in the grid. It acts as the logic layer.

### 2. The Painter: Gemini 3.0 Pro Image (Nano Banana Pro)
*   **Model ID:** `gemini-3-pro-image-preview`
*   **Role:** High-Fidelity Synthesis.
*   **Function:** Once the panels are sliced, this state-of-the-art vision model is tasked with **Generative Re-photography**. It is prompted to "look" at the low-resolution crop and hallucinate the missing details to render a fresh 2K or 4K version, strictly strictly maintaining the original lighting and pose without the artifacts typical of standard upscalers.

## ⚠️ Security & Precautions

**Please read carefully before cloning or deploying.**

This application uses the Google Gemini API. To ensure security:

1.  **NO HARDCODED KEYS:** The source code **does not** contain any API keys.
2.  **Client-Side Storage:** If you use the "Manual Entry" method in the UI, your API key is stored in your browser's `localStorage`. It never leaves your machine except to contact Google's servers.
3.  **Google Quick Connect:** The app supports the `window.aistudio` secure handshake for a keyless experience if available in your environment.

### 🛡️ For Developers
If you are forking or contributing to this repository:
*   **NEVER** commit a `.env` file containing your API Key.
*   Ensure `.env` is listed in your `.gitignore` file.
*   If you deploy this publicly (e.g., Vercel, Netlify), users must provide their own keys (BYOK - Bring Your Own Key). Do not embed your personal paid key in a public build.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key (Get one [here](https://aistudio.google.com/app/apikey))

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/ungrid.git
    cd ungrid
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm start
    ```

4.  Open `http://localhost:3000` (or the port shown in your terminal).

## 🎮 How to Use

1.  **Upload:** Drag and drop a grid image (16:9 or 1:1 aspect ratio).
2.  **Configure:**
    *   **Layout:** Choose 3x3, 2x2, or Auto-Detect (Powered by Flash 2.5).
    *   **Mode:**
        *   *Fidelity:* Strict adherence to original pixels.
        *   *Creative:* Allows the AI to hallucinate more texture.
    *   **Resolution:** Output size (1K, 2K, or 4K).
3.  **Authenticate:** Click the Key icon to connect with Google or paste an API Key.
4.  **Execute:** Click "Execute Split" to engage the Gemini 3.0 Pro pipeline.

## 📄 License

This project is open-source and available under the MIT License.