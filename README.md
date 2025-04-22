# PDF Summary AI

A full‑stack application that allows users to upload PDF documents and receive AI‑generated summaries. It supports both digital PDFs and scanned documents (via OCR fallback), stores a client‑side history, and is fully Dockerized for easy deployment.

---

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Installation & Local Development](#installation--local-development)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
5. [API Documentation](#api-documentation)
6. [Docker Usage](#docker-usage)
7. [Project Structure](#project-structure)
8. [License](#license)

---

## Features

- **PDF Upload**: Users can upload PDF files (up to 8 MB).
- **Digital Text Extraction**: Leveraging `pdf-parse` for fast extraction of embedded text.
- **OCR Fallback**: For scanned or image‑based PDFs, uses `pdfjs-dist`, `canvas`, and `tesseract.js` to perform OCR.
- **AI Summarization**: Integrates with OpenAI Chat Completions (model `gpt-4o-mini`) to generate concise summaries.
- **History**: Client stores the last 5 summaries in browser `localStorage`.
- **Error Handling**: Validates file type and size, handles upload and processing errors gracefully.
- **Dockerized**: Both backend and frontend services are containerized and orchestrated with Docker Compose.

---

## Getting Started

Clone this repository to your local machine:

```bash
git clone https://github.com/YaroslavKotovDev/pdf-summary-ai.git
cd pdf-summary-ai
```

## Prerequisites

- Node.js >= 18
- npm (bundled with Node.js)
- Docker & Docker Compose (for containerized deployment)
- An OpenAI API key

---

## Environment Variables

Create a `.env` file in the **root** of the project (and also in `/backend` if running services separately):

```ini
# OpenAI API key
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Optional: port override for backend
PORT=5000
```

> **Note**: Never commit your `.env` file to version control.

---

## Installation & Local Development

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` with your OpenAI key (see [Environment Variables](#environment-variables)).
4. Start the server:
   ```bash
   npm start
   ```
5. The backend API will run at `http://localhost:5000/`.

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. The React app will open at `http://localhost:3000/` and communicate with the backend automatically.

---

## API Documentation

### `GET /`

- **Description**: Health check endpoint.
- **Response**: Plain text – "PDF Summary AI backend is running".

### `POST /upload`

- **Description**: Upload a PDF file and receive a summary.
- **Content-Type**: `multipart/form-data`
- **Form field**: `pdf` (PDF file up to 8 MB)

#### Responses

| Status | Body                                           | Description                        |
| ------ | ---------------------------------------------- | ---------------------------------- |
| 200    | `{ "summary": "..." }`                         | Successful summarization           |
| 413    | `File too large: maximum allowed size is 8 MB` | File exceeds size limit            |
| 400    | `Only PDFs are allowed``No PDF uploaded`       | Invalid request                    |
| 500    | `Error processing PDF`                         | Server error during parsing or OCR |

---

## Docker Usage

1. Ensure Docker and Docker Compose are installed.
2. In the project root, create a `.env` file with your OpenAI key.
3. Run:
   ```bash
   docker compose up --build
   ```
4. The services will start:
    - **Backend** → `http://localhost:5000`
    - **Frontend** → `http://localhost:3000`
5. To stop and remove containers:
   ```bash
   docker compose down
   ```

---

## Project Structure

```
pdf-summary-ai/
├── backend/                # Express server + PDF parsing + OCR + OpenAI
│   ├── index.cjs            # Main server file
│   ├── package.json        # Dependencies & scripts
│   └── Dockerfile          # Docker image for backend
├── frontend/               # React + Tailwind CSS frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   └── App.js          # Main component
│   ├── package.json        # Dependencies & scripts
│   └── Dockerfile          # Docker image for frontend
├── docker-compose.yml      # Orchestrates both services
└── README.md
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

