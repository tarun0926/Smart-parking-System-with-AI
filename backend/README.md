# SmartPark AI – Backend API Documentation

Node.js, Express.js, and MongoDB backend for **SmartPark AI – Intelligent Smart Parking Management & AI Prediction System**.

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JSON Web Token (JWT) & bcryptjs password hashing
- **Security**: CORS, Protected Routes, RBAC Role Authorization

---

## 🚀 Setup & Run Instructions

1. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Seed MongoDB Database**:
   Populates local MongoDB database with sample parking garages, slots, and test accounts:
   ```bash
   npm run seed
   ```

4. **Start Backend Server**:
   ```bash
   npm start
   # or with live reloading:
   npm run dev
   ```
   Server runs on `http://localhost:5000`.

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Register driver or owner account
- `POST /api/auth/login` – Login with email & password, returns JWT token
- `POST /api/auth/logout` – Clear auth session

### Parking Locations (`/api/parking`)
- `GET /api/parking` – Retrieve all parking facilities (supports `?search=` query)
- `GET /api/parking/:id` – Retrieve single parking facility by ID with populated slots

### User Profile (`/api/users`)
- `GET /api/users/profile` – [Protected] Get logged-in user profile
- `PUT /api/users/profile` – [Protected] Update name, email, phone, vehicle plate
