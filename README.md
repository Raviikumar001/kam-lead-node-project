# kam-lead-node-project

#### backend implentation README

[Here](./backend/README.md)

#### API Documentation README

[Here](./backend/API-Documentation.md)

# Backend API

## Overview

This is the backend API for KAM project, built using Node.js and Express. It provides REST API endpoints for user authentication, lead management, and performance tracking.

### Key Features

- **User Authentication**: Register, login, and secure JWT-based authentication.
- **Lead Management**: Create, update, and manage leads in the system.
- **Performance Tracking**: Track and monitor user performance metrics.
- **Contact Management**: Manage multiple POC per resturant. Store details
- **Call Planning**: Set call frequency for each lead.Display leads requiring calls today.
- **Secure JWT-based Authentication**: JSON Web Token for secure access control.
- **PostgreSQL Database**: Data stored in a PostgreSQL database using Drizzle ORM.
- **API Input Validation**: Input validation with Zod for robust request handling.

## System Requirements

To run this API, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** (Node Package Manager)

## Installation

### 1. Clone the repository

Clone the repository to your local machine using the following command:

```bash
git clone https://github.com/Raviikumar001/kam-lead-node-project.git
cd kam-lead-node-project/backend
```

## 2. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install

```

## 3. Environment Setup

Create a .env file in the root directory with the following configuration variables:

```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h


```

## 4. Database Setup

Generate and push the database migrations:

```bash
# Generate database migrations
npm run generate

# Push migrations to the database
npm run push

```

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading enabled, use the following command:

```bash
npm run dev


```

The server will start at http://localhost:{port}.

## Available Scripts

Here are the available npm scripts for managing the application:

- **npm start**: Start the production server.
- **npm run dev**: Start the development server with nodemon.
- **npm run generate**: Generate database migrations.
- **npm run push**: Push migrations to the database.
- **npm run studio**: Open Drizzle Studio for database management.

## Project Structure

The project is structured as follows:

```bash
udaan-backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── db/         # Database models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── middleware/     # Custom middleware
├── server.js           # main file app


```

## Database Schema

The project uses PostgreSQL with Drizzle ORM for database management. The main tables are:

- users: Stores user information including email, password, name, role, and timestamps for creation and updates.

- leads: Stores information about potential customers, including their status, restaurant details, and contact preferences.

- contacts: Stores contact information for leads, including name, role, phone, email, and whether they are the primary contact.

- interactions: Logs interactions with leads, including the type of interaction, status, details, and associated order information.

- leadPerformance: Tracks performance metrics for leads, including order counts, average order value, and performance status

- orderHistory: Records historical order data for leads, including order value and date.

## Error Handling

The API uses standard HTTP response codes to indicate the outcome of requests:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
