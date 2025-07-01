# Development Roadmap: WhatsApp & Social Media SaaS Platform v2.0

This document outlines a comprehensive development plan to evolve the existing application into a scalable, multi-tool SaaS platform. The roadmap is structured into distinct phases, prioritizing a foundational architectural refactor followed by the incremental addition of new, feature-rich tools.

---

### **Phase 1: Core Architectural Refactor - The Tool-Agnostic Foundation**

**Objective:** Transition the platform from a single-purpose WhatsApp instance manager to a flexible, tool-centric architecture. This is the most critical phase and is a prerequisite for all future development.

#### **1.1. Backend Refactor**

*   **Database Schema Evolution:**
    *   **Action:** Modify the PostgreSQL database to support multiple, distinct tools.
    *   **Details:**
        *   Implement the `api_services`, `tools`, and `user_tool_permissions` tables as defined in `schema.sql`. This decouples users from a single function and allows for granular control over feature access.
        *   The `instances` table will now be explicitly linked to the "Evolution API" service via its `service_id`. It will represent a "connection" for a specific tool, rather than being the central entity of the application.

*   **API for Tool & Permission Management:**
    *   **Action:** Create new API endpoints for managing tools and user permissions.
    *   **New Endpoints:**
        *   `GET /api/tools`: Lists all available tools in the system (e.g., "WhatsApp Connection," "Group Scraper").
        *   `GET /api/users/:userId/permissions`: Retrieves the list of tools a specific user is permitted to access.
        *   `POST /api/admin/users/:userId/permissions`: Allows an admin to grant or revoke access to specific tools for a user.
    *   **Files to Modify:** `adminController.ts`, `adminRoutes.ts`, and a new `toolsController.ts`.

*   **API Request Validation:**
    *   **Action:** Integrate a robust validation library (e.g., `zod`) to sanitize and validate all incoming API request bodies.
    *   **Benefit:** This enhances security by preventing malformed data and provides clearer error feedback to the frontend.
    *   **Files to Modify:** All controller files (`authController.ts`, `adminController.ts`, `instanceController.ts`, etc.).

#### **1.2. Frontend Refactor**

*   **Dynamic Dashboard:**
    *   **Action:** Rebuild the main user dashboard to be tool-centric.
    *   **Details:** Upon login, the frontend will fetch the user's permitted tools from `/api/users/:userId/permissions` and dynamically render a "card" for each tool. Clicking a card will navigate the user to that tool's specific interface.
    *   **Files to Modify:** `UserDashboardPage.tsx` will be refactored into a more generic `DashboardPage.tsx`.

---

### **Phase 2: WhatsApp Tool Suite Implementation**

**Objective:** Build out the full suite of requested WhatsApp automation tools on top of the new architecture.

*   **Tool 1: WhatsApp Connection Manager (Refactor)**
    *   **Action:** Reframe the existing `InstanceManager.tsx` component as the dedicated "WhatsApp Connection" tool. Its functionality remains the same, but it will now be accessed via its own tool card on the dashboard.

*   **Tool 2: WhatsApp Group Scraper**
    *   **Backend:**
        *   Create a new endpoint: `POST /api/tools/whatsapp/scrape-group`.
        *   This endpoint will require an `instanceId` and a `groupId`, call the relevant Evolution API function, and return the list of group members.
    *   **Frontend:**
        *   Create a new page and component, `GroupScraperPage.tsx`.
        *   The UI will allow the user to select one of their connected instances, input a WhatsApp Group ID, and view/download the scraped list of contacts.

*   **Tool 3: WhatsApp Campaign Manager**
    *   **Backend:**
        *   **Database:** Create a new `campaigns` table to store campaign name, target audience (list of numbers), message content, associated instance, and status (`pending`, `running`, `complete`).
        *   **API:** Develop a full CRUD API for campaigns (`GET /api/campaigns`, `POST /api/campaigns`, `DELETE /api/campaigns/:id`).
        *   **Service:** Create a background job/service that periodically checks for `pending` campaigns, queues them up, and sends messages sequentially via the selected WhatsApp instance to avoid rate-limiting.
    *   **Frontend:**
        *   Create a new `CampaignsPage.tsx`.
        *   The UI will provide an interface to create a new campaign, name it, paste a list of phone numbers, compose a message, select a sending instance, and schedule it.
        *   A dashboard view will show all campaigns and their current status.

---

### **Phase 3: n8n-Powered Facebook Page Manager**

**Objective:** Integrate with an external n8n workflow to add Facebook page management as a new tool, proving the platform's scalability.

*   **Backend:**
    *   **Configuration:** Add "n8n" as a new entry in the `api_services` table. Store the n8n webhook URL and any necessary API keys securely in the `.env` file.
    *   **Service:** Create a generic `n8nService.ts` responsible for making authenticated calls to your n8n webhooks.
    *   **Controller:** Develop a new `facebookController.ts` with an endpoint like `POST /api/tools/facebook/post`. This endpoint will take the post content and an optional image URL, then trigger the corresponding n8n webhook.

*   **Frontend:**
    *   **Tool Integration:** Add "Facebook Page Manager" to the `tools` table so it can be assigned to users.
    *   **UI:** Create a new `FacebookManagerPage.tsx`. This page will contain a simple form where a user can write a text update, optionally provide an image link, and click "Post to Page."

---

### **Phase 4: Quality Assurance & UI/UX Polish**

**Objective:** Elevate the application to a professional standard by improving the user interface, providing better feedback, and ensuring backend reliability through automated testing.

*   **UI Component Library Integration:**
    *   **Action:** Adopt a professional React component library like **Material-UI (MUI)**.
    *   **Task:** Systematically replace all basic HTML elements (`<button>`, `<input>`, forms, etc.) across the entire application with their MUI equivalents. This will create a cohesive, modern, and visually appealing user experience.

*   **User-Friendly Notifications:**
    *   **Action:** Remove all instances of `window.alert()`.
    *   **Task:** Implement a non-blocking "toast" notification system (e.g., `react-hot-toast`) for displaying all success messages, errors, and other user feedback.

*   **Backend Testing Framework:**
    *   **Action:** Establish a robust testing suite for the Node.js backend.
    *   **Task:**
        *   Install and configure `Jest` and `Supertest`.
        *   Write comprehensive integration tests for all API endpoints, including authentication, admin user CRUD, tool permissions, and the new campaign/scraper endpoints.
        *   This ensures that future changes do not break existing functionality.
