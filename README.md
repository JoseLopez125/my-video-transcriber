# Scrybe - AI-Powered Video and Audio Transcription Service

Scrybe is a web application that leverages Google's powerful AI to transcribe speech from video and audio files into text. It provides a seamless user experience for uploading media and viewing the generated transcriptions with timestamps.

## Features

*   **Multi-Format Media Support:** Upload and transcribe `.mp4`, `.mov`, and `.mp3` files.
*   **AI-Powered Transcription:** Utilizes Google Cloud's Video Intelligence API for highly accurate speech-to-text conversion.
*   **Timestamped Transcripts:** View the generated transcript with corresponding timestamps for easy navigation and reference.
*   **Downloadable Transcripts:** Download the full transcription for offline use.
*   **User Authentication:** Secure user sign-up and sign-in functionality provided by Firebase Authentication.
*   **Cloud Storage:** Media files are securely uploaded and stored using Firebase Storage.

## Tech Stack

### Frontend

*   **Framework:** Next.js (with React)
*   **Styling:** Tailwind CSS
*   **Firebase Integration:** Client-side integration for authentication and storage.

### Backend

*   **Platform:** Firebase Functions
*   **Language:** Python
*   **Core Transcription Service:** Google Cloud Video Intelligence API
*   **Storage:** Google Cloud Storage

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js and npm (or yarn) installed.
*   Python and pip installed.
*   A Firebase project with Authentication, Firestore, and Storage enabled.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    ```
2.  **Install frontend dependencies:**
    ```sh
    npm install
    ```
3.  **Install backend dependencies:**
    ```sh
    cd functions
    pip install -r requirements.txt
    ```
4.  **Set up Firebase credentials:**
    *   Create a `serviceAccountKey.json` for your Firebase project and place it in the `functions` directory.
    *   Configure your Firebase project settings in the frontend Firebase config file.

### Running the Application

1.  **Start the frontend development server:**
    ```sh
    npm run dev
    ```
2.  **Emulate the backend functions (in a separate terminal):**
    ```sh
    firebase emulators:start
    ```

## Usage

1.  Navigate to the sign-up page to create a new account.
2.  After signing in, you will be directed to the home page.
3.  Click the "Upload" button to select a `.mp4`, `.mov`, or `.mp3` file.
4.  The transcription process will begin automatically.
5.  Once completed, you can view the timestamped transcript on the page or download it as a text file.
