# WhatsApp & Social Media SaaS Platform v2.0

Welcome to the official documentation for the WhatsApp & Social Media SaaS Platform. This is a full-stack, multi-user, multi-tool application designed to provide a suite of automation tools for businesses and developers. Built on a robust and scalable architecture, the platform features a persistent PostgreSQL database, a secure Node.js backend API, and a dynamic, real-time React frontend.

The application is architected to be extensible, allowing for the seamless addition of new tools and integrations in the future. It includes a comprehensive admin dashboard for full user lifecycle management, permission control, and instance configuration.

---

## Core Concepts

To understand the platform's architecture, it's essential to be familiar with these core concepts:

### 1. Tool-Centric Architecture

The entire platform is built around the idea of **Tools**. A "Tool" is a distinct feature or capability that can be assigned to users on a permission basis. This is the foundation of our SaaS model. Instead of a single-purpose application, the platform serves as a container for various tools.

-   **Examples:** "WhatsApp Connections," "Campaign Manager," "Group Scraper."
-   **Permissions:** Administrators can grant or revoke access to specific tools for each user, allowing for tiered subscription plans and feature-gating.
-   **Extensibility:** New features are added as new, independent tools, ensuring the core system remains stable and easy to maintain.

### 2. Instances

An **Instance** represents a persistent, authenticated connection to an external service. It is the bridge between our platform and an end-user's account on another platform (like WhatsApp).

-   **Example:** To use any WhatsApp-related tool, a user must first create a "WhatsApp Connection" Instance by scanning a QR code. This securely links their phone to our system via the Evolution API.
-   **Purpose:** An Instance holds the necessary credentials (like API keys or connection status) required to perform actions on behalf of the user. A campaign, for example, must be linked to a specific Instance to know which WhatsApp account should send the messages.

### 3. Campaigns

A **Campaign** is a bulk messaging job. It is a core feature built on top of the Instance and Tool architecture.

-   **Composition:** A campaign is composed of an audience (a list of phone numbers), content (a list of text and/or media messages), and a set of delivery rules (timing, personalization, etc.).
-   **Execution:** Campaigns are executed by a background service on the server to ensure reliability and prevent API timeouts. The system is designed to run one campaign per Instance at a time to avoid rate-limiting and ensure stable performance.
-   **Stateful:** Campaigns are stateful, meaning they can be started, paused, resumed, and stopped. All progress is tracked in the database, allowing the system to gracefully recover from interruptions.











## Technology Stack

This project is built using a modern, robust, and type-safe technology stack. The stack is divided into three main areas: Backend, Frontend, and Development/Tooling.

### Backend

-   **Language: TypeScript**
    > Provides strong static typing, which catches errors during development, improves code quality, and makes the application easier to maintain and scale.

-   **Runtime & Framework: Node.js with Express**
    > Node.js offers excellent performance for I/O-heavy applications like ours. Express provides a minimalist and powerful foundation for building our RESTful API and routing system.

-   **Database: PostgreSQL (node-postgres)**
    > A powerful, open-source relational database known for its reliability, data integrity features, and scalability. It's the source of truth for all user data, instances, and campaigns.

-   **Real-Time Communication: Socket.IO**
    > Enables bi-directional, real-time communication between the client and server. This is essential for pushing live status updates for campaigns and instance connections directly to the UI without requiring a refresh.

-   **Authentication: JSON Web Tokens (jsonwebtoken)**
    > A stateless and secure standard for creating access tokens that verify user identity on every API request without needing to store session data on the server.

-   **Password Security: bcryptjs**
    > A widely trusted library for securely hashing user passwords with a salt, protecting them against brute-force and rainbow table attacks.

-   **API Request Validation: Zod**
    > A TypeScript-first schema declaration and validation library. We use it to validate and sanitize all incoming API request bodies, enhancing security and providing clear error feedback.

-   **API Client: axios**
    > A promise-based HTTP client that simplifies making requests from our backend to the external Evolution API.

### Frontend

-   **Library & Language: React with TypeScript**
    > React's component-based architecture is ideal for building our complex, interactive user interface. TypeScript adds the benefits of type safety to the frontend, preventing common bugs.

-   **Component Library: Material-UI (MUI)**
    > A comprehensive suite of pre-built React components that implement Google's Material Design. It allows us to build a visually appealing, consistent, and professional-looking UI efficiently.

-   **Real-Time Client: socket.io-client**
    > The official client-side library for Socket.IO, allowing our React application to easily connect to the backend WebSocket server and listen for real-time events.

-   **State Management: React Context API**
    > Provides a clean and built-in way to manage and share global state (like user authentication status) across the entire application without needing external libraries.

-   **Routing: react-router-dom**
    > The standard library for handling client-side routing in React, enabling us to create a navigable single-page application (SPA) with distinct URLs for different views and tools.

-   **API Client: axios**
    > Used for all communication with our backend API. An interceptor is configured to automatically attach the user's JWT to every request, simplifying component logic.

-   **Notifications: react-hot-toast**
    > A lightweight and customizable library for displaying non-blocking "toast" notifications for success messages, errors, and other user feedback.

### Development & Tooling

-   **Package Manager: npm**
    > The standard package manager for Node.js, used to manage all project dependencies.

-   **Backend Dev Server: ts-node-dev**
    > A tool that transpiles TypeScript and restarts the Node.js server automatically on file changes, greatly speeding up backend development.

-   **Frontend Build Tool: Create React App (react-scripts)**
    > Provides a modern, pre-configured build setup for the React application, handling all the complexities of compilation, optimization, and development out of the box.












## Project Setup & Installation

This guide will walk you through setting up the entire platform for local development. Both the backend server and the frontend client must be running simultaneously for the application to function correctly.

### Prerequisites

Before you begin, ensure you have the following installed on your system:
-   **Node.js** (v16 or later recommended)
-   **npm** (usually comes with Node.js)
-   **PostgreSQL** (v12 or later recommended)
-   An accessible instance of the **Evolution API**

### 1. Database Setup

1.  **Create the Database:**
    -   Using a tool like `psql` or a GUI like pgAdmin, create a new, empty PostgreSQL database. A recommended name is `whatsapp_saas`.
    -   Ensure the database user you will connect with has permissions to create extensions.

2.  **Run the Schema Script:**
    -   Connect to your newly created database.
    -   Execute the entire `server/schema.sql` script. This will create all the necessary tables, relationships, and indexes.

### 2. Backend Server Setup

1.  **Navigate to the Server Directory:**
    ```sh
    cd server
    ```

2.  **Install Dependencies:**
    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    -   Create a `.env` file in the `server` directory by copying the example: `cp .env.example .env`.
    -   Open the `.env` file and edit the variables with your specific configuration:
        ```env
        # Your PostgreSQL connection string
        DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/whatsapp_saas

        # A long, random, secret string for signing JWTs
        JWT_SECRET=your_super_secret_key_please_change_me

        # The full URL of your running Evolution API instance
        EVOLUTION_API_URL=http://localhost:8080

        # The API key for your Evolution API instance
        EVOLUTION_API_KEY=your_evolution_api_key
        ```

4.  **Seed the Database (Critical First Step):**
    -   This script creates the initial `admin` user, the `Evolution API` service, and the default tools. You must run this to be able to log in for the first time.
    ```sh
    npm run seed
    ```
    -   The default admin credentials are `username: admin` and `password: admin123`.

5.  **Start the Development Server:**
    ```sh
    npm run dev
    ```
    -   The backend server will start on `http://localhost:5001`.

### 3. Frontend Client Setup

1.  **Navigate to the Client Directory (in a new terminal):**
    ```sh
    cd client
    ```

2.  **Install Dependencies:**
    ```sh
    npm install
    ```

3.  **Start the Development Server:**
    ```sh
    npm start
    ```
    -   A new tab will open in your browser at `http://localhost:3000`. The application should now be running.












## Environment Variables & Configuration

This section details all the environment variables required to run the backend server and other important configuration values that can be adjusted.

### Server Environment Variables (`server/.env`)

All backend configuration is managed through the `.env` file in the `server` directory.

| Variable              | Description                                                                                                                              | Example                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`        | **Required.** The full connection string for your PostgreSQL database.                                                                   | `postgresql://postgres:password@localhost:5432/whatsapp_saas` |
| `JWT_SECRET`          | **Required.** A long, random, and secret string used to sign and verify JSON Web Tokens. Changing this will invalidate all existing logins. | `some_very_long_and_random_string_of_characters`          |
| `EVOLUTION_API_URL`   | **Required.** The base URL of the Evolution API instance that the platform will communicate with.                                        | `http://localhost:8080`                                   |
| `EVOLUTION_API_KEY`   | **Required.** The global API key for your Evolution API instance, used for administrative actions.                                       | `your_evolution_api_key_here`                             |
| `PORT`                | *Optional.* The port on which the backend server will run. Defaults to `5001`.                                                           | `5001`                                                    |

### Adjustable Backend Service Variables

Certain "magic numbers" that control the behavior of core services are hardcoded for simplicity. If you need to fine-tune the platform's performance or humanization features, these are the variables to look for.

#### Campaign Service (`server/src/services/campaignService.ts`)

| Variable                        | Line (approx.) | Default | Description                                                                                                   |
| ------------------------------- | :------------: | :-----: | ------------------------------------------------------------------------------------------------------------- |
| `typingDelayMap`                |       28       | `{...}` | A map of speeds (`fast`, `medium`, `slow`, `safe`) to the number of milliseconds of typing delay per character. |
| `INTER_PART_DELAY_MIN_SECONDS`  |       35       |    `1`    | The minimum number of seconds to wait between sending different parts (e.g., image and text) of the same message. |
| `INTER_PART_DELAY_MAX_SECONDS`  |       36       |    `2`    | The maximum number of seconds to wait between sending different parts of the same message.                    |






## API Endpoint Documentation

All API endpoints are prefixed with `/api`. All protected routes require a valid JSON Web Token (JWT) to be sent in the `Authorization` header in the format `Bearer <token>`.

---

### **Authentication (`/api/auth`)**

These endpoints handle user login.

#### `POST /login`
-   **Description:** Authenticates a user with their username and password. On success, it returns a JWT for use in subsequent requests.
-   **Protection:** `Public`
-   **Request Body:**
    ```json
    {
      "username": "admin",
      "password": "admin123"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "message": "Login successful!",
      "token": "ey...",
      "user": {
        "id": "c2455e41-062d-463b-8db3-654c6c4797f9",
        "username": "admin",
        "role": "admin"
      }
    }
    ```

---

### **Admin (`/api/admin`)**

These endpoints are for administrative tasks and are strictly protected.

#### `POST /users`
-   **Description:** Creates a new user account.
-   **Protection:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "username": "newuser",
      "password": "newpassword123",
      "role": "user",
      "instanceLimit": 5
    }
    ```
-   **Success Response (201 Created):** The newly created user object (excluding the password hash).

#### `GET /users`
-   **Description:** Retrieves a list of all user accounts in the system.
-   **Protection:** `Admin Only`
#### `DELETE /users/:userId`  *(<-- NEW)*
-   **Description:** Deletes a user account. This action is permanent and will cascade-delete all of their associated data (instances, campaigns, etc.). An admin cannot delete their own account.
-   **Protection:** `Admin Only`

#### `PUT /users/:userId/password`  *(<-- NEW)*
-   **Description:** Updates the password for a specific user.
-   **Protection:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "password": "a_new_strong_password"
    }
    ```

#### `PUT /users/:userId/instance-limit`  *(<-- NEW)*
-   **Description:** Updates the instance limit for a specific user.
-   **Protection:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "instanceLimit": 10
    }
    ```
    
#### `GET /users/:userId/permissions`
-   **Description:** Retrieves an array of `tool_id`s that a specific user has permission to access.
-   **Protection:** `Admin Only`
-   **Success Response (200 OK):** `[1, 2]`

#### `POST /users/:userId/permissions`
-   **Description:** Overwrites the entire set of tool permissions for a specific user. Sending an empty array will revoke all tool access.
-   **Protection:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "toolIds": [1, 2]
    }
    ```

#### `GET /instances`  *(<-- NEW)*
-   **Description:** Retrieves a list of *all* instances across the entire system, including the username of the owner.
-   **Protection:** `Admin Only`
-   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "uuid-for-instance-1",
        "display_name": "My First Instance",
        "status": "open",
        "webhook_url": "http://example.com/hook",
        "owner_username": "testuser"
      }
    ]
    ```

#### `POST /instances/:instanceId/config`  *(<-- NEW)*
-   **Description:** Updates the configuration for any instance in the system. Can update one or both properties.
-   **Protection:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "webhookUrl": "http://new-url.com/hook"
    }
    ```

---


### **Instances (`/api/instances`)**

These endpoints are for managing service connections (e.g., WhatsApp accounts).

#### `GET /`
-   **Description:** Retrieves a list of all instances belonging to the currently authenticated user.
-   **Protection:** `Authenticated User`

#### `POST /`
-   **Description:** Creates a new WhatsApp instance on the Evolution API provider and saves a corresponding record in our database.
-   **Protection:** `Authenticated User`
-   **Request Body:**
    ```json
    { 
      "instanceDisplayName": "My Business Account", 
      "phoneNumber": "15551234567" 
    }
    ```
-   **Success Response (201 Created):** Includes the new instance object and a base64-encoded QR code string for phone pairing.

#### `DELETE /:instanceId`
-   **Description:** Deletes a specific instance. The backend ensures the user owns the instance before proceeding.
-   **Protection:** `Authenticated User`

#### `GET /sync`
-   **Description:** Manually triggers a synchronization with the Evolution API to update the status and profile details of all the user's instances.
-   **Protection:** `Authenticated User`

#### `GET /:instanceId/connect`
-   **Description:** Fetches a new QR code for an existing, disconnected instance.
-   **Protection:** `Authenticated User`

---

### **Campaigns (`/api/campaigns`)**

These endpoints are for managing bulk messaging campaigns.

#### `GET /`
-   **Description:** Retrieves a summary list of all campaigns belonging to the authenticated user.
-   **Protection:** `Authenticated User`

#### `POST /`
-   **Description:** Creates a new campaign in a `draft` state. The backend verifies that the user owns the specified `instanceId`.
-   **Protection:** `Authenticated User`
-   **Request Body:**
    ```json
    {
      "name": "Q4 Holiday Promotion",
      "instanceId": "a1b2c3d4-...",
      "messages": [
        { "type": "image", "url": "http://.../promo.jpg", "caption": "Check this out!" },
        { "type": "text", "content": "Hi {{name}}, get 20% off!" }
      ],
      "numbers": ["15551234567", "15557654321"],
      "usePlaceholders": true,
      "delaySpeed": "safe",
      "delayFromSeconds": 10,
      "delayToSeconds": 25,
      "sendingMode": "internal"
    }
    ```

#### `GET /:id`
-   **Description:** Retrieves the full details for a single campaign, including its list of recipients and their individual statuses.
-   **Protection:** `Authenticated User`

#### `DELETE /:id`
-   **Description:** Deletes a campaign. This can only be performed on campaigns that are in a terminal state (e.g., `draft`, `completed`, `stopped`).
-   **Protection:** `Authenticated User`

#### `POST /:id/control`
-   **Description:** Manages the lifecycle of a campaign. This is the endpoint used to start, pause, or stop a campaign.
-   **Protection:** `Authenticated User`
-   **Request Body:**
    ```json
    { "action": "start" }
    ```
    *Possible values for `action`: `"start"`, `"pause"`, `"stop"`.*
-   **Success Response (202 Accepted for 'start'):** Indicates the campaign has been accepted for background processing. Other actions return a 200 OK.

---

### **Tools & Permissions (`/api/tools`, `/api/permissions`)**

These endpoints provide metadata for the frontend UI.

#### `GET /tools`
-   **Description:** Retrieves a list of all available tools in the system. Intended for use in admin panels to populate permission checklists.
-   **Protection:** `Authenticated User` (Though primarily for Admins)

#### `GET /permissions/my-permissions`
-   **Description:** Retrieves the list of tools the currently authenticated user is permitted to use. This is essential for dynamically building the user's main dashboard.
-   **Protection:** `Authenticated User`














## Real-Time Events (WebSockets)

The application uses Socket.IO to push live updates from the server to the client, creating a dynamic and responsive user experience. This section documents the WebSocket event protocol.

### Connection & Authentication

1.  **Connection:** The client should connect to the root URL of the backend server (e.g., `http://localhost:5001`).

2.  **Authentication:** Immediately after a successful `connect` event, the client **MUST** emit an `authenticate` event to the server, sending its JWT as the payload. This allows the server to associate the socket connection with a specific user ID and join them to a private "room." Without this step, the user will not receive any targeted real-time updates.

    -   **Event Name:** `authenticate`
    -   **Payload:** `string` (The user's JWT)

    **Client-Side Example (`socket.ts`):**
    ```javascript
    socket.on('connect', () => {
      socket.emit('authenticate', your_jwt_token_here);
    });
    ```

### Server-to-Client Events

The client should listen for the following events from the server.

#### `instance_status_update`
-   **Description:** Fired when an instance's connection status changes (e.g., from `connecting` to `open`). This is typically triggered by a webhook from the Evolution API.
-   **Payload:**
    ```json
    {
      "instanceName": "The system_name of the instance",
      "status": "open" 
    }
    ```
-   **Used In:** `WhatsAppConnectionPage.tsx` to update the status of an instance card in real-time.

#### `campaign_update`
-   **Description:** Fired when the overall status of a campaign changes (e.g., from `running` to `completed`).
-   **Payload:**
    ```json
    {
      "campaignId": "76defa4a-ad65-4393-8cc2-24f9b64f42cf",
      "status": "completed"
    }
    ```
-   **Used In:** `CampaignDetailsPage.tsx` to update the main status chip and enable/disable control buttons.

#### `campaign_progress`
-   **Description:** Fired periodically as a campaign runs, providing updates on the status of individual recipients. This event is the engine of the live monitoring dashboard.
-   **Payload:**
    ```json
    {
      "campaignId": "76defa4a-ad65-4393-8cc2-24f9b64f42cf",
      "updatedRecipients": [
        {
          "id": 123, // The database ID of the recipient
          "status": "sent", // or "failed"
          "log_message": "Sent successfully."
        }
        // This array may contain one or more updated recipients
      ]
    }
    ```
-   **Used In:** `CampaignDetailsPage.tsx` to update the progress bar and the status of specific rows in the recipients table.







whatsapp-saas-platform/
│
├── 📁 client/ (Frontend React Application)
│   ├── 📁 public/
│   │   └── index.html         (Main HTML shell for the React app)
│   ├── 📁 src/
│   │   ├── 📁 api/
│   │   │   └── apiClient.ts       (Central Axios instance for all backend API calls)
│   │   ├── 📁 components/
│   │   │   ├── 📁 auth/
│   │   │   │   ├── LoginForm.tsx      (The refactored MUI login form)
│   │   │   │   └── PrivateRoute.tsx   (Higher-order component to protect routes)
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── ToolCard.tsx       (The MUI card for displaying a single tool on the dashboard)
│   │   │   ├── 📁 user/
│   │   │   │   └── InstanceManager.tsx (Component for managing WhatsApp connections, now with MUI)
│   │   │   ├── 📁 admin/
│   │   │   │   └── UserManagement.tsx (Placeholder for future admin UI)
│   │   │   └── 📁 common/
│   │   │       ├── Header.tsx         (Placeholder for a dedicated header component)
│   │   │       └── Spinner.tsx        (Placeholder for a loading spinner component)
│   │   ├── 📁 contexts/
│   │   │   └── AuthContext.tsx    (Global state management for user authentication)
│   │   ├── 📁 hooks/
│   │   │   └── useAuth.ts         (Custom hook to easily access the AuthContext)
│   │   ├── 📁 pages/
│   │   │   ├── AdminDashboardPage.tsx (Main view for the admin section)
│   │   │   ├── LoginPage.tsx        (The public login page)
│   │   │   ├── UserDashboardPage.tsx  (The main tool-centric dashboard for logged-in users)
│   │   │   └── 📁 tools/
│   │   │       ├── WhatsAppConnectionPage.tsx (Dedicated page for the InstanceManager tool)
│   │   │       ├── CampaignsDashboardPage.tsx (Lists all user campaigns)
│   │   │       ├── CreateCampaignPage.tsx   (The form for creating a new campaign)
│   │   │       └── CampaignDetailsPage.tsx  (The live monitoring page for a single campaign)
│   │   ├── 📁 services/
│   │   │   └── socket.ts          (Manages the client-side WebSocket connection)
│   │   ├── App.tsx              (Main application component, defines routing and layout)
│   │   ├── index.tsx            (Top-level entry point, applies theme and context providers)
│   │   ├── theme.ts             (The custom MUI theme for a consistent "skin")
│   │   └── types.ts             (Shared TypeScript interfaces: User, Instance, Tool, etc.)
│   ├── package.json
│   └── tsconfig.json
│
└── 📁 server/ (Backend Node.js Application)
    ├── .env.example         (Template for environment variables)
    ├── .env                 (Your local configuration, ignored by Git)
    ├── 📁 src/
    │   ├── 📁 api/
    │   │   └── evolutionApi.ts    (The client for all communication with the external Evolution API)
    │   ├── 📁 config/
    │   │   └── index.ts           (Loads and exports environment variables)
    │   ├── 📁 controllers/
    │   │   ├── adminController.ts      (Logic for admin actions: creating users, managing permissions)
    │   │   ├── authController.ts       (Logic for user login)
    │   │   ├── instanceController.ts   (Logic for managing WhatsApp instances)
    │   │   ├── permissionController.ts (Logic for fetching a user's own permissions)
    │   │   ├── toolController.ts       (Logic for listing all available tools)
    │   │   ├── campaignController.ts   (Logic for campaign CRUD and state control)
    │   │   └── webhookController.ts    (Handles incoming webhooks from external services)
    │   ├── 📁 middleware/
    │   │   ├── adminMiddleware.ts      (Checks if a user has the 'admin' role)
    │   │   └── authMiddleware.ts       (Checks if a user's JWT is valid)
    │   ├── 📁 models/
    │   │   ├── Instance.ts          (Legacy TypeScript interface for an Instance)
    │   │   └── User.ts              (Legacy TypeScript interface for a User)
    │   ├── 📁 routes/
    │   │   ├── adminRoutes.ts          (Defines all `/api/admin` endpoints)
    │   │   ├── authRoutes.ts           (Defines the `/api/auth/login` endpoint)
    │   │   ├── instanceRoutes.ts       (Defines all `/api/instances` endpoints)
    │   │   ├── permissionRoutes.ts     (Defines the `/api/permissions/my-permissions` endpoint)
    │   │   ├── toolRoutes.ts           (Defines the `/api/tools` endpoint)
    │   │   ├── campaignRoutes.ts       (Defines all `/api/campaigns` endpoints)
    │   │   └── webhookRoutes.ts        (Defines public webhook endpoints)
    │   ├── 📁 services/
    │   │   ├── campaignService.ts    (The core background service for sending campaigns)
    │   │   └── socketService.ts      (Manages all server-side WebSocket logic and event emitting)
    │   ├── app.ts                 (Main Express application setup: middleware and route registration)
    │   ├── db.ts                  (Configures the PostgreSQL connection pool)
    │   ├── seed.ts                (Script to seed the database with initial admin/tool data)
    │   └── server.ts              (The entry point for the backend, starts the HTTP and WebSocket servers)
    ├── package.json
    ├── schema.sql             (The complete, authoritative database schema)
    └── tsconfig.json








### File Structure and Architectural Philosophy

This document provides a detailed walkthrough of the project's file structure. Understanding the purpose of each directory is key to navigating the codebase efficiently, making modifications, and adding new features in a way that is consistent with the established design patterns.

---

### **`client/` - The Frontend Application**

This directory contains the entire React-based user interface. It is a self-contained Single-Page Application (SPA) created with Create React App.

#### `client/src/api/`
-   **`apiClient.ts`**: This is the heart of frontend-to-backend communication. It's a pre-configured `axios` instance.
    -   **Purpose:** To centralize all API calls. No component should ever use `fetch` or a raw `axios` call directly.
    -   **Key Feature:** It uses an **Axios interceptor** to automatically attach the user's JWT (`Authorization: Bearer <token>`) to every single outgoing request. This dramatically simplifies component logic, as we don't need to manage the token in every component that makes an API call.

#### `client/src/components/`
This directory holds all reusable React components, organized by feature or domain.
-   **`/auth/`**: Components related to authentication, like `LoginForm.tsx`.
-   **`/dashboard/`**: Components used specifically on the main user dashboard, like `ToolCard.tsx`.
-   **`/user/`**: Components related to a standard user's features, like the `InstanceManager.tsx`.
-   **`/admin/` & `/common/`**: Placeholders for future components. The goal is to keep components modular and easy to find.

#### `client/src/contexts/`
-   **`AuthContext.tsx`**: This is our global state manager for authentication.
    -   **Purpose:** It holds the user's data, the JWT, and the authentication status (`isAuthenticated`, `isLoading`). It exposes functions like `login()` and `logout()`.
    -   **Mechanism:** By wrapping the entire application in `<AuthProvider>` (in `index.tsx`), any component can access this global state via the `useAuth` hook, avoiding the need to pass user data down through many layers of props (prop drilling).

#### `client/src/hooks/`
-   **`useAuth.ts`**: A custom React hook.
    -   **Purpose:** To provide a clean, one-line way for components to access the `AuthContext`. Instead of importing `useContext` and `AuthContext` everywhere, a component can just call `const { user, login } = useAuth();`.

#### `client/src/pages/`
This directory contains the top-level components for each "page" or "view" in the application, corresponding to a specific route.
-   **Linking:** These components are directly linked to routes defined in `App.tsx`.
-   **`/tools/`**: A subdirectory specifically for the main pages of each tool (e.g., `CampaignsDashboardPage.tsx`). This keeps the tool-specific views organized as we add more.
-   **Purpose:** Pages are responsible for fetching the data needed for that view and arranging the layout using smaller, reusable components from the `components` directory.

#### `client/src/services/`
-   **`socket.ts`**: Manages the client-side WebSocket lifecycle.
    -   **Purpose:** To provide simple, clean functions (`connectSocket`, `listenForEvent`) that components can use without needing to know the implementation details of Socket.IO. It handles the crucial `authenticate` event emission upon connection.

#### `client/src/` (Root Files)
-   **`App.tsx`**: The main application component.
    -   **Responsibilities:** 1) Renders the main layout, including the persistent MUI `<AppBar>`. 2) Defines all client-side URL routes using `react-router-dom`.
-   **`index.tsx`**: The absolute top-level entry point for the React app.
    -   **Responsibilities:** 1) Renders the `<App />` component into the DOM. 2) Wraps the entire application in essential global providers like `<AuthProvider>` and MUI's `<ThemeProvider>`.
-   **`theme.ts`**: The single source of truth for the application's visual "skin." All colors, fonts, and default component styles are defined here, ensuring a consistent look and feel everywhere.

---

### **`server/` - The Backend Application**

This directory contains the entire Node.js/Express backend API. It follows a standard, layered architecture pattern for separation of concerns.

#### `server/src/api/`
-   **`evolutionApi.ts`**: The dedicated client for communicating with the external Evolution API.
    -   **Purpose:** To abstract away the details of the third-party API. If the Evolution API ever changes its endpoints or authentication, we only need to update this one file. The rest of our backend code (services, controllers) remains unchanged.

#### `server/src/controllers/`
This is the "business logic" layer.
-   **Purpose:** Controllers receive requests from the routes, perform validation and authorization, orchestrate calls to services or the database, and formulate the final HTTP response to send back to the client.
-   **Example Flow:** `campaignController.ts` receives a request to start a campaign. It validates the request, checks permissions, updates the database status, and then calls `campaignService.ts` to do the heavy lifting.

#### `server/src/middleware/`
-   **`authMiddleware.ts` & `adminMiddleware.ts`**: These are Express middleware functions.
    -   **Purpose:** To intercept incoming requests before they reach the controller. They are used for cross-cutting concerns like security.
    -   **`authMiddleware.ts`**: Decodes the JWT from the `Authorization` header. If valid, it attaches the `user` object to the request. If invalid, it immediately ends the request with a `401` or `403` error.
    -   **Linking:** This middleware is attached to routes in the `routes/` files (e.g., `router.use(authMiddleware)`).

#### `server/src/routes/`
This is the routing layer.
-   **Purpose:** Each file in this directory defines a set of API endpoints for a specific resource (e.g., `campaignRoutes.ts` defines all `/api/campaigns/...` endpoints).
-   **Responsibility:** A route's only job is to link an HTTP method and a URL path to a specific controller function. It does not contain any business logic itself.
-   **Linking:** All route files are imported and registered in `app.ts` (e.g., `app.use('/api/campaigns', campaignRoutes)`).

#### `server/src/services/`
This directory is for complex, long-running, or reusable business logic that shouldn't live in a controller.
-   **`socketService.ts`**: Manages all server-side WebSocket connections, user room management, and provides a clean `emitToUser` function that can be called from any other part of the backend.
-   **`campaignService.ts`**: The "engine" for sending campaigns. It was moved to a service because it's a complex, long-running background process. This keeps the `campaignController` clean and focused on just handling the initial HTTP request.

#### `server/src/` (Root Files)
-   **`app.ts`**: The core Express application instance. Its primary job is to configure application-level middleware (like `cors` and `express.json`) and to register all the route handlers from the `/routes` directory.
-   **`server.ts`**: The entry point of the backend. It imports the `app` instance, creates an HTTP server from it, initializes the `socketService` by attaching it to the server, and starts listening for connections on the specified port.
-   **`db.ts`**: Configures and exports the `pg` connection pool. This is imported by controllers to run database queries.
-   **`schema.sql`**: The single, authoritative source of truth for the entire database structure. Any change to the database tables **must** be reflected here.
```

I have completed the detailed file structure guide. Please let me know what you would like to do next.