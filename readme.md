````markdown
# WhatsApp SaaS Platform - v1.0

This is a full-stack, multi-user SaaS application designed to provide users with tools for managing WhatsApp instances, built on top of the Evolution API. The application features a persistent PostgreSQL database, a secure Node.js backend, and a real-time React frontend. This platform serves as a robust foundation for businesses and developers looking to leverage WhatsApp automation, offering a clear separation between a secure, scalable backend API and a dynamic, user-friendly frontend interface.

---

## Core Features

-   **Persistent User Sessions**: Leverages JSON Web Tokens stored in the browser's local storage to ensure users remain logged in across page refreshes and browser sessions. The frontend architecture includes a loading state to gracefully handle session verification, preventing users from being logged out during page loads.
-   **Real-Time UI Updates**: Utilizes a WebSocket connection managed by socket.io to push live data from the server to the client. When a background event occurs (like a successful WhatsApp connection via webhook), the UI updates instantly without requiring a manual refresh, creating a modern and seamless user experience.
-   **PostgreSQL Database**: All application data, including user credentials, instance details, and permissions, is stored in a robust and scalable PostgreSQL database. The schema is designed with clear relationships, foreign key constraints, and indexes to ensure data integrity and query performance.
-   **Role-Based Access Control (RBAC)**: A secure distinction between admin and user roles is enforced on the backend. This foundational security model allows for future expansion where admins can be granted exclusive access to management panels and user control features.
-   **Instance Management API**: A complete RESTful API provides the full lifecycle management for WhatsApp instances. This includes endpoints to create, list, sync status from the provider, fetch new connection QR codes, and securely delete instances.
-   **Secure Instance Management**: All instance-related API endpoints are protected by authentication middleware. The backend logic includes ownership checks on every request, guaranteeing that a user can only view, manage, or delete instances that are explicitly linked to their account.
-   **Webhook Integration**: A dedicated, public-facing webhook endpoint is available to receive real-time event notifications from the Evolution API. This is the primary mechanism that powers the real-time status updates, as it allows the external service to notify our application of important changes instantly.

---

## Technology Stack

### Backend

-   **Language: TypeScript**
    > Provides strong static typing, which catches errors during development, improves code quality, and makes the application easier to maintain and scale.
-   **Framework: Node.js with Express**
    > Node.js offers excellent performance for I/O-heavy applications, while Express provides a minimalist and powerful foundation for building our RESTful API.
-   **Database: PostgreSQL (node-postgres)**
    > A powerful, open-source relational database known for its reliability, data integrity features, and scalability.
-   **Real-Time: socket.io**
    > Enables bi-directional, real-time communication between the client and server, essential for pushing live status updates to the UI.
-   **Authentication: JSON Web Tokens (jsonwebtoken)**
    > A stateless and secure standard for creating access tokens that verify user identity without needing to store session data on the server.
-   **Password Hashing: bcryptjs**
    > A widely trusted library for securely hashing user passwords with a salt, protecting them against brute-force and rainbow table attacks.
-   **API Client: axios**
    > A promise-based HTTP client that simplifies making requests from our backend to the external Evolution API.

### Frontend

-   **Library: React with TypeScript**
    > React's component-based architecture is ideal for building complex, interactive user interfaces, while TypeScript adds the benefits of type safety.
-   **Real-Time: socket.io-client**
    > The official client-side library for socket.io, allowing our React application to easily connect to the backend WebSocket server and listen for events.
-   **State Management: React Context API**
    > Provides a clean and built-in way to manage and share global state (like user authentication status) across the entire application without needing external libraries.
-   **Routing: react-router-dom**
    > The standard library for handling client-side routing in React, enabling us to create a navigable single-page application (SPA) with distinct URLs for different views.
-   **API Client: axios**
    > Used for all communication with our backend API. An interceptor is configured to automatically attach the user's JWT to every request, simplifying component logic.
-   **Build Tool: Create React App**
    > Provides a modern, pre-configured build setup for React applications, handling all the complexities of compilation and development out of the box.

---

## API Endpoints

All API endpoints are prefixed with `/api`.

### Authentication

`POST /auth/login`
-   **Description**: Authenticates a user with their credentials.
-   **Protection**: Public.
-   **Body**:
    ```json
    { "username": "testuser", "password": "password123" }
    ```
-   **Returns**: A JWT token and a user object (`{ id, username, role }`) on success.

### Admin (Protected)

All admin routes require a valid JWT from a user with the `admin` role.

`POST /admin/users`
-   **Description**: Creates a new user account. This is the primary endpoint for an admin to onboard new clients.
-   **Body**:
    ```json
    { "username": "newuser", "password": "newpassword", "role": "user", "instanceLimit": 5 }
    ```
-   **Returns**: The newly created user's data, excluding the password hash.

### Instances (Protected)

All instance routes require a valid JWT from an authenticated user.

`GET /instances/sync`
-   **Description**: Triggers a synchronization process. It calls the Evolution API's `/fetchInstances` endpoint to get the latest data for all instances and updates the corresponding records in our local database. This is used to sync statuses, profile names, and real phone numbers.
-   **Returns**: The complete, updated list of instances belonging to the user from our database.

`GET /instances`
-   **Description**: Retrieves a list of all instances belonging to the authenticated user directly from our local database.
-   **Returns**: An array of the user's instance objects.

`POST /instances`
-   **Description**: Creates a new WhatsApp instance on the Evolution API and saves a corresponding record in our database.
-   **Body**:
    ```json
    { "instanceDisplayName": "My Business Account", "phoneNumber": "15551234567" }
    ```
-   **Returns**: The new instance object and a base64-encoded QR code for connecting a phone.

`GET /instances/:instanceId/status`
-   **Description**: Gets the live connection state (e.g., 'open', 'connecting') for a specific instance directly from the Evolution API provider.
-   **Returns**: The provider's instance state object.

`GET /instances/:instanceId/connect`
-   **Description**: Fetches a new QR code for an existing instance, typically used if the instance is disconnected.
-   **Returns**: An object containing the new `qrCodeBase64` and `pairingCode`.

`DELETE /instances/:instanceId`
-   **Description**: Deletes a specific instance. It first sends a request to delete the instance from the Evolution API provider, then deletes the corresponding record from our local database.
-   **Returns**: A success message.

### Webhooks (Public)

`POST /webhooks/evolution`
-   **Description**: A public endpoint designed to receive real-time event notifications from the Evolution API. This is the core of our real-time functionality.
-   **Protection**: Public (must be accessible by the external Evolution API server).
-   **Action**: When it receives an event like `connection.update`, it updates the instance's status in our database and then uses WebSockets to push a notification to the correct user's browser, triggering an instant UI update.

---

## Project Setup and Installation

To run this project locally, you will need Node.js, npm, and a running instance of both PostgreSQL and the Evolution API.

### 1. Database Setup
1.  Using a tool like pgAdmin or the `psql` command line, create a new, empty PostgreSQL database. A recommended name is `whatsapp_saas`.
2.  Connect to your new database and execute the entire `server/schema.sql` script. This will create all the necessary tables, relationships, and indexes. Ensure the user you are connected with has permissions to create extensions (`uuid-ossp`).

### 2. Backend Setup
1.  Navigate to the `server` directory:
    ```sh
    cd server
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  **Configure Environment Variables**: Create a `.env` file in the `server` directory by copying the example: `cp .env.example .env`. Edit the `.env` file with your specific configuration:
    ```env
    DATABASE_URL=postgresql://postgres:your_password@localhost:5432/whatsapp_saas
    JWT_SECRET=your_super_secret_key
    EVOLUTION_API_URL=http://localhost:8080
    EVOLUTION_API_KEY=your_evolution_api_key
    ```
4.  **Seed the Database**: Run the seed script to create the initial admin user and required service data. This is a critical step to ensure you can log in for the first time.
    ```sh
    npm run seed
    ```
5.  Start the development server:
    ```sh
    npm run dev
    ```
    The backend server will start on `http://localhost:5001`.

### 3. Frontend Setup
1.  Navigate to the `client` directory:
    ```sh
    cd client
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Start the development server:
    ```sh
    npm start
    ```
    A new tab will open in your browser at `http://localhost:3000`.

**Note**: Both the backend and frontend servers must be running simultaneously in separate terminals for the application to function correctly.
````


whatsapp-saas-platform/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.ts
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── PrivateRoute.tsx
│   │   │   └── user/
│   │   │       └── InstanceManager.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── UserDashboardPage.tsx
│   │   ├── services/
│   │   │   └── socket.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
└── server/
    ├── .env
    ├── .env.example
    ├── src/
    │   ├── api/
    │   │   └── evolutionApi.ts
    │   ├── config/
    │   │   └── index.ts
    │   ├── controllers/
    │   │   ├── adminController.ts
    │   │   ├── authController.ts
    │   │   ├── instanceController.ts
    │   │   └── webhookController.ts
    │   ├── middleware/
    │   │   ├── adminMiddleware.ts
    │   │   └── authMiddleware.ts
    │   ├── models/
    │   │   ├── Instance.ts
    │   │   └── User.ts
    │   ├── routes/
    │   │   ├── adminRoutes.ts
    │   │   ├── authRoutes.ts
    │   │   ├── instanceRoutes.ts
    │   │   └── webhookRoutes.ts
    │   ├── services/
    │   │   └── socketService.ts
    │   ├── app.ts
    │   ├── db.ts
    │   ├── seed.ts
    │   └── server.ts
    ├── package.json
    ├── schema.sql
    └── tsconfig.json