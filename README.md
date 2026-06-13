# Nitta 🚀

Nitta is a modern, secure monorepo application containing a robust Node.js/Express backend and a responsive Vite + React frontend. The application features user and admin authentication dashboards, OTP-based email verification, Google OAuth, and a mock payment sandbox.

## 🌐 Live Deployment
You can access the live deployed site here:
**👉 [https://nitta-2.onrender.com](https://nitta-2.onrender.com)**

---

## ✨ Features
*   **Role-Based Dashboards**: Distinct and secure interfaces for both standard users and administrators.
*   **Secure Authentication**: Standard sign-in/sign-up backed by JWTs and session storage.
*   **OTP & Verification**: Email verification via timed One-Time Passwords (OTP).
*   **Google OAuth Integration**: Fast and secure third-party login with automated account synchronization.
*   **Mock Payment Sandbox**: Integrated Razorpay client in Mock Payment Sandbox mode for transaction simulation.
*   **Unified Monorepo Architecture**: Frontend served statically through backend routing in production.

---

## 🛠️ Tech Stack
*   **Frontend**: Vite, React, Vanilla CSS
*   **Backend**: Node.js, Express, Passport.js, MongoDB + Mongoose
*   **Deployment**: Render

---

## 📂 Project Structure
```text
nitta-monorepo/
├── backend/            # Express.js REST API & production asset server
└── frontend/
    └── vite-project/   # Vite + React Single Page Application (SPA)
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Setup & Run
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Pradeepnitta/Nitta.git
   cd Nitta
   ```

2. **Install all dependencies & build frontend:**
   From the root folder, run:
   ```bash
   npm run build
   ```

3. **Configure Environment Variables:**
   Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   # To enable email OTPs:
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   Open `https://localhost:5173` in your browser.
