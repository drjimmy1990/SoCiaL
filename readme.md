# WhatsApp SaaS Platform

This is a full-stack, multi-user SaaS application designed to provide users with tools for managing WhatsApp instances, built on top of the Evolution API. The application features a secure Node.js backend and a dynamic React frontend.

## Core Features

* **User Authentication:** Secure login system using JSON Web Tokens (JWT).
* **Role-Based Access Control:** Distinction between `admin` and `user` roles.
* **Admin User Creation:** Admins can create new user accounts via the API.
* **Instance Management (User Dashboard):**
    * Authenticated users can create new WhatsApp instances.
    * Instance creation is subject to admin-defined limits.
    * Users can view a list of their instances.
    * Fetch a connection QR code for any instance.
    * Check the connection status of any instance.
    * Delete instances.
* **API Security:** Backend routes are protected to ensure users can only manage their own instances.

## Technology Stack

### Backend
* **Language:** TypeScript
* **Framework:** Node.js with Express
* **Authentication:** JSON Web Tokens (`jsonwebtoken`)
* **Password Hashing:** `bcryptjs`
* **API Client:** `axios`
* **Database:** Designed for PostgreSQL (currently uses an in-memory store for demonstration)

### Frontend
* **Library:** React with TypeScript
* **State Management:** React Context API
* **Routing:** `react-router-dom`
* **API Client:** `axios`
* **Build Tool:** Create React App

## Project Setup and Installation

To run this project locally, you will need Node.js, npm, and a running instance of the [Evolution API](https://doc.evolution-api.com/).

### 1. Backend Setup

The backend server handles all API logic and communication with the Evolution API.

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the `server` directory by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file with your specific configuration:
    ```ini
    PORT=5001
    DATABASE_URL=postgresql://user:password@host:port/database
    JWT_SECRET=your_super_secret_key
    EVOLUTION_API_URL=http://localhost:8080 # Your Evolution API URL
    EVOLUTION_API_KEY=your_evolution_api_key
    ```
4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The backend server will start on the port specified in your `.env` file (e.g., `http://localhost:5001`).

### 2. Frontend Setup

The frontend is a React single-page application that consumes the backend API.

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    ```
    A new tab will open in your browser at `http://localhost:3000`. The application will connect to the backend server running on port 5001.

**Note:** Both the backend and frontend servers must be running simultaneously in separate terminals for the application to function correctly.