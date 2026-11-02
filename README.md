# Smart-parking-System-with-AI
# 🚗 SmartPark AI – Intelligent Smart Parking Management & AI Prediction System

> **College Major Project / Final Year Engineering Demonstration**  
> **Full Stack Architecture**: React.js 19 + Node.js Express + MongoDB + Python FastAPI Machine Learnin

---

## 📌 Project Overview

**SmartPark AI** is an end-to-end, production-grade smart parking management platform designed to eliminate urban traffic congestion and parking search delays. By uniting IoT sensor tracking, interactive geospatial mapping, and machine learning availability forecasting, SmartPark AI empowers drivers, facility owners, and city administrators with live telemetry and data-driven automation.

### 🌟 Key Highlights
- **Real-Time Bay Availability**: Live tracking of parking spots with instantaneous state synchronization.
- **Machine Learning Forecasting**: Trained multi-output Random Forest regressor predicting occupancy across 30, 60, and 90-minute horizons.
- **Smart Recommendation Engine**: Multi-factor ranking algorithm scoring facilities by distance, current availability, predicted future occupancy, and hourly price.
- **Three-Tier Role Architecture**: Dedicated, protected dashboards for **Drivers (Users)**, **Parking Facility Operators (Owners)**, and **System Administrators (Admins)**.
- **Robust Fault Tolerance**: Zero-crash design with automatic in-memory fallback if MongoDB or FastAPI is offline.

---

## 🚀 Features Breakdown

### 🚗 1. Driver (User) Experience
- **Interactive Geospatial Map**: Leaflet & OpenStreetMap visualization with live distance calculations and markers.
- **Smart Recommendations**: Evaluates and suggests the best garage with transparent factor score breakdowns.
- **Interactive Bay Selection**: Visual garage floor plans allowing drivers to pick standard or EV charging bays.
- **Reservation & QR Pass**: Instant booking with automated double-booking prevention and QR pass generation.
- **My Bookings Dashboard**: Real-time pass history with cancel/release options and live status badges.

### 🏢 2. Parking Owner Experience
- **Owner Control Center**: Telemetry for managed facilities:
  - Total slots, live available bays, occupied bays, today's bookings, and daily revenue.
  - Multi-horizon AI predictions (+30m, +60m, +90m) with trend indicators and actionable demand alerts.
  - Weekly revenue performance area charts.
- **My Parking Spots**: Full CRUD management to register new parking locations, configure hourly rates, update addresses, and list amenities (EV fast charging, CCTV, valet).
- **Slot Sensor Manager**: Interactive bay matrix allowing facility managers to toggle bay states (`Available` ➔ `Occupied` ➔ `Maintenance`) in real-time.
- **Facility Reservations**: Live log of customer bookings with check-in QR pass audit and manual bay release.

### 🛡️ 3. Platform System Administrator Experience
- **Admin Command Center**:
  - Global telemetry: Total registered users, active parking locations, total bays, available bays, occupied bays, today's bookings, and platform-wide revenue.
  - 4 Dynamic Recharts:
    1. **Occupancy Trends**: Live sensor occupancy vs AI forecast.
    2. **Booking Trends**: Weekly volume distribution.
    3. **Revenue Trends**: Daily platform intake (₹).
    4. **Parking-Wise Occupancy**: Capacity utilization rates across all city garages.
- **User Directory Management**: Search, filter by role (Driver, Owner, Admin), toggle account status (Active / Suspended), update roles, and remove accounts.
- **Parking Verification Audit**: Approve, edit rates, toggle maintenance mode, or decommission facilities.
- **Global Bookings Audit Log**: Search all platform transactions, inspect QR verification tickets, and export audit logs as CSV.

### 🧠 4. AI Machine Learning Service (FastAPI)
- **Multi-Output Random Forest Regressor** (`model.joblib`) trained on synthetic urban parking traffic patterns.
- Simultaneous prediction of 30, 60, and 90-minute occupancy percentages and bay counts.
- Inference latency: `< 15ms`.
- Graceful heuristic fallback if the Python service is offline.

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v3, React Router v6, Recharts, Lucide React, Axios |
| **Backend** | Node.js (v20+), Express.js (ES Modules), Mongoose, JWT, Bcrypt.js, CORS, Dotenv |
| **Database** | MongoDB (with embedded `mongodb-memory-server` automatic fallback) |
| **AI / ML Service** | Python 3.11+, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib |

---

## 📁 Folder Structure

```
Smart parking/parking/
├── ai-service/                     # Python FastAPI Machine Learning Microservice
│   ├── app.py                      # FastAPI REST application (endpoints: /predict, /health, /metrics)
│   ├── train.py                    # Random Forest training script & evaluator
│   ├── generate_dataset.py         # Realistic urban parking dataset generator
│   ├── test_prediction.py          # AI service automated test suite
│   ├── model.joblib                # Trained Multi-Output ML Model Artifact
│   ├── dataset.csv                 # Generated training dataset
│   └── requirements.txt            # Python dependencies (fastapi, uvicorn, scikit-learn, etc.)
│
├── backend/                        # Node.js + Express + MongoDB REST API Server
│   ├── config/
│   │   └── db.js                   # MongoDB connection with auto-seeding & in-memory fallback
│   ├── controllers/
│   │   ├── authController.js       # Register, login, JWT issuance, password hashing
│   │   ├── parkingController.js    # CRUD parking, slot management, nearby search, recommend
│   │   ├── bookingController.js    # Booking creation, double-booking validation, cancellation
│   │   ├── userController.js       # User profile, admin user management (status, delete)
│   │   └── analyticsController.js  # Telemetry aggregates for Admin & Owner dashboards
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT bearer token verification & role attachment
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, password, role, vehicle, status)
│   │   ├── Parking.js              # Facility schema (name, coordinates, rates, capacity, owner)
│   │   ├── ParkingSlot.js          # Bay schema (slotNumber, floor, type, status, price)
│   │   └── Booking.js              # Reservation schema (user, slot, duration, amount, qrCodeId)
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth routes
│   │   ├── parkingRoutes.js        # /api/parking routes
│   │   ├── bookingRoutes.js        # /api/bookings routes
│   │   ├── userRoutes.js           # /api/users routes
│   │   └── analyticsRoutes.js      # /api/analytics routes
│   ├── test_core_parking.js        # Automated core parking & double-booking test suite
│   ├── test_admin_owner_flow.js    # Automated admin & owner feature test suite
│   ├── server.js                   # Express server entry point (Port 5000)
│   └── package.json
│
├── src/                            # React.js 19 Frontend Application
│   ├── components/
│   │   ├── common/                 # Navbar, Sidebar, ProtectedRoute, MetricCard, StatusBadge
│   │   ├── landing/                # Hero, Features, HowItWorks, LiveMap, Testimonials
│   │   ├── layouts/                # PublicLayout, DashboardLayout
│   │   └── parking/                # AIPredictionCard, LeafletMap, ParkingFilter, SmartRecommendationCard
│   ├── context/
│   │   └── AuthContext.jsx         # Authentication, JWT management, role switching
│   ├── data/
│   │   └── mockData.js             # Client fallback fixtures & presentation datasets
│   ├── pages/
│   │   ├── public/                 # LandingPage, LoginPage, RegisterPage
│   │   ├── user/                   # UserDashboard, ParkingMapPage, ParkingDetailsPage, MyBookingsPage, ProfilePage
│   │   ├── owner/                  # OwnerDashboard, MyParkingPage, ManageSlotsPage, OwnerBookingsPage
│   │   └── admin/                  # AdminDashboard, UsersPage, ParkingLocationsPage, AllBookingsPage
│   ├── routes/
│   │   └── AppRoutes.jsx           # Protected & public route definitions
│   ├── services/
│   │   └── api.js                  # Axios client configured with JWT interceptors
│   ├── App.jsx
│   └── main.jsx
│
├── package.json                    # Frontend dependencies & build scripts
├── tailwind.config.js              # Tailwind styling configuration
└── vite.config.js                  # Vite bundler & reverse proxy configuration
```

---

## ⚙️ Environment Variables

### 1. Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smartpark_ai
JWT_SECRET=smartpark_ai_super_secret_jwt_key_2026
JWT_EXPIRE=30d
NODE_ENV=development
AI_SERVICE_URL=http://127.0.0.1:8000
```

### 2. Frontend (`.env` or Vite Defaults)
```env
VITE_API_BASE_URL=/api
```
*(Vite proxies `/api` to `http://localhost:5000` via `vite.config.js` to avoid CORS issues).*

---

## 🛠️ Step-by-Step Setup & Run Instructions

### Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: v3.10+ (tested on v3.11)
- *(Optional)* **MongoDB**: Local MongoDB community service or MongoDB Atlas. If MongoDB is not running, the backend automatically spins up an in-memory database!

---

### 1. Run the AI Microservice (Python FastAPI)

1. Open a new terminal and navigate to `ai-service`:
   ```bash
   cd "ai-service"
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the automated prediction test suite:
   ```bash
   python test_prediction.py
   ```
   *(Expected output: `ALL 7 TESTS PASSED SUCCESSFULLY!`)*
4. Start the FastAPI server:
   ```bash
   python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```
   API Docs available at: `http://127.0.0.1:8000/docs`

---

### 2. Run the Backend API (Node.js Express)

1. Open a second terminal and navigate to `backend`:
   ```bash
   cd "backend"
   ```
2. Install dependencies:
   ```bash
   npm.cmd install
   ```
3. Run verification test suites:
   ```bash
   node test_core_parking.js
   node test_admin_owner_flow.js
   ```
   *(Expected output: `ALL 8 CORE TESTS PASSED` and `ALL ADMIN & OWNER FLOWS VERIFIED`)*
4. Start the Express server:
   ```bash
   npm.cmd start
   ```
   Server runs on: `http://localhost:5000`

---

### 3. Run the Frontend (React Vite)

1. Open a third terminal in the root project folder:
   ```bash
   npm.cmd install
   ```
2. Start the Vite development server:
   ```bash
   npm.cmd run dev
   ```
3. Open your browser:
   ```
   http://localhost:5173
   ```

---

## 🧪 How to Train the AI Machine Learning Model

To retrain the Random Forest model on updated data:

1. Navigate to `ai-service`:
   ```bash
   cd "ai-service"
   ```
2. Generate synthetic urban parking dataset:
   ```bash
   python generate_dataset.py
   ```
   *Creates `dataset.csv` with 2,500+ records containing temporal, event, and occupancy features.*
3. Train the model:
   ```bash
   python train.py
   ```
   *Outputs:*
   - `model.joblib` (Random Forest Multi-Output Regressor)
   - Evaluates Mean Absolute Error (MAE) and $R^2$ Score ($R^2 \approx 0.993$).
4. Run verification tests:
   ```bash
   python test_prediction.py
   ```

---

## 📡 API Documentation

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register Driver or Owner account | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `POST` | `/api/auth/logout` | Revoke session | Public |

### 🚗 Parking Facilities (`/api/parking`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/parking` | List all parking facilities with filter/search | Public |
| `POST` | `/api/parking` | Create new parking facility & slot bays | Private (Owner/Admin) |
| `GET` | `/api/parking/nearby` | Geospatial nearby search (`?lat=&lng=&maxKm=`) | Public |
| `GET` | `/api/parking/recommend` | Multi-factor AI recommendation engine | Public |
| `GET` | `/api/parking/:id` | Facility details with bay breakdown | Public |
| `PUT` | `/api/parking/:id` | Update facility details, pricing, status | Private (Owner/Admin) |
| `DELETE` | `/api/parking/:id` | Remove parking facility & slot bays | Private (Owner/Admin) |
| `GET` | `/api/parking/:id/slots` | Retrieve slot bays for facility | Public |
| `POST` | `/api/parking/:id/slots` | Add new slot bay | Private (Owner) |
| `PUT` | `/api/parking/:id/slots/:slotId` | Update slot status (`available/occupied/maintenance`) | Private (Owner) |
| `GET` | `/api/parking/:id/prediction` | Query Python FastAPI ML inference | Public |

### 🎟️ Bookings & Reservations (`/api/bookings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/bookings` | Reserve a bay (validates slot & double-booking) | Private |
| `GET` | `/api/bookings/my` | Get current logged-in driver's bookings | Private |
| `GET` | `/api/bookings` | Admin global audit log of all platform bookings | Private (Admin) |
| `GET` | `/api/bookings/owner` | Bookings for owner's managed garages | Private (Owner) |
| `GET` | `/api/bookings/:id` | Retrieve reservation details & QR pass | Private |
| `PUT` | `/api/bookings/:id/cancel` | Cancel booking & release bay back to pool | Private |

### 👥 User Management (`/api/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users/profile` | Get logged-in user profile | Private |
| `PUT` | `/api/users/profile` | Update profile details / vehicle registration | Private |
| `GET` | `/api/users` | Admin directory of all registered users | Private (Admin) |
| `PUT` | `/api/users/:id/status` | Toggle user status (Active / Suspended) | Private (Admin) |
| `DELETE` | `/api/users/:id` | Delete user account | Private (Admin) |

### 📊 Telemetry & Analytics (`/api/analytics`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/analytics/admin` | 7 Core Admin Metrics + 4 Recharts datasets | Private (Admin) |
| `GET` | `/api/analytics/owner` | Owner slots, revenue, bookings & AI forecast | Private (Owner) |

---

## 🎓 College Viva & Examiner Demonstration Script

Follow this step-by-step checklist during project presentation:

### 1. Preset Demo Credentials
Use the built-in quick presets on the Login page (`/login`):
- **Driver (Alex Morgan)**: `alex.m@example.com` / `password123`
- **Owner (Sarah Jenkins)**: `sarah.j@parkingsolutions.com` / `password123`
- **Admin (System Admin)**: `admin@smartpark.ai` / `password123`

### 2. Complete Flow Demonstration Checklist
1. **Landing Page (`/`)**: Show hero banner, dynamic live map, how-it-works workflow, and live metrics.
2. **Register (`/register`)**: Register a new user account with role selection (Driver or Owner).
3. **Login (`/login`)**: Demonstrate invalid credentials rejection (`Invalid email or password credentials`), then log in with valid credentials.
4. **User Dashboard (`/user/dashboard`)**: Show personalized driver statistics, active vehicle pass, and quick search.
5. **Parking Map (`/user/map`)**: View nearby parking lots with interactive Leaflet map markers and filters.
6. **Smart Recommendation**: Show top-ranked facility based on distance, price, and current + predicted availability.
7. **Parking Details & AI Prediction (`/parking/p1`)**:
   - Inspect the **AI Availability Prediction Card** with 30m, 60m, 90m horizons and demand trends.
   - Show graceful degradation behavior if AI service is offline.
8. **Slot Selection & Booking**:
   - Select an available bay (e.g. `A1`).
   - Confirm booking: slot status turns to `occupied`, available count decrements.
   - Demonstrate **Double-Booking Protection**: attempting to book an occupied or overlapping bay triggers a conflict warning.
9. **My Bookings (`/user/bookings`)**: View confirmed ticket with QR code pass. Test cancellation to release the bay.
10. **Owner Dashboard (`/owner/dashboard`)**:
    - Log in as Owner (`sarah.j@parkingsolutions.com`).
    - Show owner-specific parking data: Total slots, Available bays, Occupied bays, Today's bookings, Revenue, and AI predictions.
    - Go to **Manage Slots (`/owner/slots`)**: Click any bay to cycle its state (`Available` ➔ `Occupied` ➔ `Maintenance`).
    - Go to **My Parking (`/owner/parking`)**: Add a new parking facility with custom rate and slots.
    - Go to **Owner Bookings (`/owner/bookings`)**: View reservation passes for the owner's garages.
11. **Admin Dashboard (`/admin/dashboard`)**:
    - Log in as Admin (`admin@smartpark.ai`).
    - Show 7 key platform metrics (Total users, locations, total slots, available slots, occupied slots, today's bookings, revenue).
    - Show 4 Recharts charts (Occupancy trends, booking trends, revenue trends, parking-wise occupancy).
    - Go to **Manage Users (`/admin/users`)**: Search, filter, toggle user status (Active / Suspended), or delete.
    - Go to **Manage Parking (`/admin/parking-locations`)**: Edit parking rates, toggle maintenance mode.
    - Go to **Audit Log (`/admin/bookings`)**: Inspect full platform reservation log and export as CSV.
12. **Role Protection Test**: Attempting to navigate directly to `/admin/*` as a regular driver displays the **Role Authorization Required** screen.

---

## 📜 License & Acknowledgements
Developed for Academic Project Submission. Built with open-source tools: React.js, Tailwind CSS, Node.js, Express, MongoDB, and FastAPI.
