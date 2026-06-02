# EquipBookingApp - Equipment Reservation System

## Description
EquipBookingApp is a modern web application designed for managing equipment rentals. The system allows users to browse available items and submit reservation requests, while administrators have full control over the equipment database, approving reservations, and managing item availability statuses.

## System architecture
The system is built on a decoupled architecture (Client-Server), ensuring high performance and easy scalability.

## Directory structure & files
* `frontend/`: React application source code (Vite). Contains the user interface and API communication logic.
* `EquipBooking.Api/`: ASP.NET Core backend. Contains controllers, data models, and business logic.
* `Dockerfile`: Instructions for building the container image for the backend application.
* `Program.cs`: The backend entry point, configuring CORS, JWT authorization, and endpoint mapping.

## How it works
1. **Authentication**: The user logs in and receives a JWT token, which is sent in the headers of subsequent requests to ensure secure access.
2. **Communication**: The frontend sends HTTP requests to the REST API, which processes the business logic and communicates with the PostgreSQL database (Neon).
3. **Authorization**: The system verifies the user's role (standard user vs. administrator) upon every attempt to modify data or change a reservation status.

## Example login credentials
To test the administrative features of the application, you can use the following default credentials seeded into the database:
* **Username:** `admin`
* **Password:** `admin123`

## Local installation

### Prerequisites
* .NET SDK 10.0
* Node.js (v18+)
* Docker (optional)

### Steps
1. Clone the repository
2. **Backend**:
   - Navigate to the backend directory: `cd EquipBooking.Api/`
   - Configure your local `user-secrets` (Database Connection String and JWT Key).
   - Run the API: `dotnet run`
3. **Frontend**:
   - Navigate to the frontend directory: `cd frontend/`
   - Install dependencies: `npm install`
   - Run the development server: `npm run dev`

## Security & Technologies
* **JWT (JSON Web Token)**: Ensures secure and stateless user sessions.
* **CORS**: Specifically configured to allow secure communication between the frontend domain and the backend API.
* **ORM (Entity Framework Core)**: Object-oriented database management.
