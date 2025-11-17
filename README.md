# Jiba Jaba CRM v2

A clean, web-based CRM for commercial real-estate brokers. It manages contacts, records call notes (typed or dictated), tracks call outcomes, handles follow-ups through an internal Call List, and includes a fully functional Import Contacts feature.

This project is built with React, TypeScript, and Tailwind CSS, and it leverages the Google Gemini API for intelligent features.

## Key Features

-   **Contact Management:** A full suite of CRUD (Create, Read, Update, Delete) operations for your contacts, complete with robust search and filtering capabilities.
-   **Notes & History:** Record detailed call notes either by typing or using voice-to-text dictation. Every interaction, from notes to deal stage changes, is logged in a chronological history for each contact.
-   **Follow-Up Dashboard:** A dedicated "Follow Up" view acts as a smart call list, organizing all scheduled tasks by due date. It clearly highlights overdue items so nothing falls through the cracks.
-   **Deal Flow Kanban Board:** Visualize your entire pipeline on a drag-and-drop Kanban board. Move contacts seamlessly between custom deal stages as they progress.
-   **Data Portability:**
    -   **Import:** Easily import your existing contacts from CSV, VCF (vCard), or JSON files with an intelligent column-mapping interface.
    -   **Export:** Export all contacts to a CSV file or back up your entire CRM data (contacts, follow-ups, settings) to a JSON file.
-   **Deep Customization:** Tailor the CRM to your workflow by creating, editing, reordering, and color-coding your own custom "Lead Types" and "Deal Stages". You can also customize the "One-Click Update" buttons for call outcomes.
-   **AI-Powered Suggestions:** Leveraging the Gemini API, the CRM analyzes your call notes and automatically suggests updating a contact's deal stage if relevant keywords are detected (e.g., "sent LOI," "under contract").
-   **Productivity Tools:**
    -   **Merge Duplicates:** Clean up your database by automatically finding and merging duplicate contacts based on phone numbers.
    -   **Printable Call Sheets:** Generate clean, printable call sheets for your "Open" or "Overdue" tasks for offline work.

## Tech Stack

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** Tailwind CSS
-   **AI Integration:** Google Gemini API (`@google/genai`)
-   **Data Persistence:** A mock API using `localStorage` to simulate a backend, making the app fully functional offline in the browser.
-   **Mobile Deployment:** Configured with Capacitor for easy conversion into a native mobile application.

## Getting Started

This project is set up to be run in an environment where the Google Gemini API key is available as an environment variable.

### Prerequisites

-   Node.js and npm
-   A Google Gemini API Key

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd jiba-jaba-crm
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your API Key:**
    The application expects the Gemini API key to be available in `process.env.API_KEY`. In a development environment like the one this app is built for, this is typically handled by the execution environment.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

-   `src/components/`: Contains all React components, from individual icons to major views like `ContactDetail` and `Dashboard`.
-   `src/hooks/`: Reusable custom hooks, such as `useSpeechRecognition` for voice dictation.
-   `src/services/`: Includes the mock API (`mockApi.ts`) for data persistence and the Gemini service (`geminiService.ts`) for AI features.
-   `src/types.ts`: Defines all TypeScript interfaces for core data structures like `Contact`, `Note`, and `AppSettings`.
-   `src/constants.ts`: Stores constant values used across the application, like color themes for labels.
-   `src/App.tsx`: The main application component that orchestrates state, views, and data flow.
