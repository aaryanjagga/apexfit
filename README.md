# ApexFit Gym Management System (MERN Stack)

A production-grade Gym Management System built exclusively on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) with real-time digital membership passes, cryptographic Razorpay payment verification, and multi-device data consistency.

---

## 🏛️ Strict Architecture

```
React (Vite + Tailwind CSS)
            ↓ (REST API / JSON)
Express.js Server
            ↓ (Controller + Validation + Middleware)
Node.js Runtime
            ↓ (Mongoose ODM)
MongoDB Atlas (Single Source of Truth)
```

> **STRICT STACK COMPLIANCE**:
> - Frontend: React.js (React 19), Vite, React Router, Tailwind CSS, Lucide icons.
> - Backend: Node.js, Express.js.
> - Database: MongoDB with Mongoose ODM (MongoDB Atlas in production).
> - Payments: Razorpay (server-verified HMAC-SHA256 signatures).
> - Authentication: JWT (JSON Web Tokens) & bcryptjs.
> - **NO** SQLite, MySQL, Postgres, Firebase, Supabase, PHP, Django, Laravel, or Next.js.

---

## 🔐 ENVIRONMENT VARIABLES — ADD YOUR OWN KEYS

> ⚠️ **CRITICAL SECURITY WARNING:**  
> **DO NOT COMMIT `.env` TO GITHUB OR ANY PUBLIC REPOSITORY!**  
> All sensitive configuration must remain strictly inside your local `.env` file, which is automatically ignored by `.gitignore`.

### Where to Obtain Your Credentials

Create a `.env` file inside `gym-management-system/server/.env` (you can copy `.env.example`):

```bash
cp server/.env.example server/.env
```

| Environment Variable | Where to Obtain It | Instructions |
|---|---|---|
| **`MONGODB_URI`** | **MongoDB Atlas** (<https://cloud.mongodb.com>) | 1. Sign in to MongoDB Atlas.<br>2. Create a free cluster or select an existing one.<br>3. Click **Connect** → **Drivers** (Node.js).<br>4. Copy the connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/apexfit?retryWrites=true&w=majority`).<br>5. Replace `<password>` with your database user password. |
| **`RAZORPAY_KEY_ID`** | **Razorpay Dashboard** (<https://dashboard.razorpay.com>) | 1. Log in to your Razorpay Dashboard.<br>2. Navigate to **Account & Settings** → **API Keys**.<br>3. Click **Generate Test Key** (or Live Key for production).<br>4. Copy the **Key ID** (`rzp_test_...` or `rzp_live_...`). |
| **`RAZORPAY_KEY_SECRET`** | **Razorpay Dashboard** (<https://dashboard.razorpay.com>) | 1. In the same API Keys screen as above, copy the **Key Secret**.<br>2. *Never expose this secret on the frontend or commit it to version control.* |
| **`JWT_SECRET`** | **Local Terminal** | Generate a high-entropy cryptographically secure string by running in your terminal:<br>`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **`CLIENT_URL`** | **Your Frontend Host** | For local development, set to: `http://localhost:5173`. In production, set to your frontend domain (e.g., `https://apexfit.example.com`). |
| **`SERVER_URL`** | **Your Backend Host** | For local development, set to: `http://localhost:5000`. In production, set to your backend domain. |

### Complete `.env.example` Reference

```env
# ------------------------------------------------------------------------------
# 1. SERVER CONFIGURATION
# ------------------------------------------------------------------------------
PORT=5000
NODE_ENV=development

# ------------------------------------------------------------------------------
# 2. MONGODB ATLAS DATABASE
# ------------------------------------------------------------------------------
# Paste your MongoDB Atlas connection string below:
MONGODB_URI=PASTE_YOUR_MONGODB_CONNECTION_STRING_HERE

# ------------------------------------------------------------------------------
# 3. AUTHENTICATION (JWT)
# ------------------------------------------------------------------------------
# Generate a strong random secret:
JWT_SECRET=PASTE_A_LONG_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=7d

# ------------------------------------------------------------------------------
# 4. RAZORPAY PAYMENT GATEWAY
# ------------------------------------------------------------------------------
# Get these from Razorpay Dashboard → Account & Settings → API Keys:
RAZORPAY_KEY_ID=PASTE_YOUR_RAZORPAY_KEY_ID_HERE
RAZORPAY_KEY_SECRET=PASTE_YOUR_RAZORPAY_KEY_SECRET_HERE

# ------------------------------------------------------------------------------
# 5. FRONTEND & BACKEND URLS (CORS)
# ------------------------------------------------------------------------------
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

---

## 💳 Mandatory Razorpay Payment Flow

```
User/Admin selects Plan
          ↓
Frontend requests Order (/api/payments/create-order)
          ↓
Express Backend invokes Razorpay API (razorpay.orders.create)
          ↓
Backend returns Order ID + Details to Frontend
          ↓
Razorpay Checkout Modal opens in Browser
          ↓
User completes transaction
          ↓
Razorpay returns:
  - razorpay_order_id
  - razorpay_payment_id
  - razorpay_signature
          ↓
Frontend submits tokens to /api/payments/verify
          ↓
Backend performs server-side HMAC-SHA256 signature verification:
  crypto.createHmac('sha256', secret)
        .update(order_id + "|" + payment_id)
        .digest('hex') === signature
          ↓
[ONLY UPON CRYPTOGRAPHIC VERIFICATION]
  1. Save Payment record with status: 'success'
  2. Compute and extend membership expiry date
  3. Activate/Renew Membership record in MongoDB
  4. Create Audit Log entry
  5. Return fresh updated state to all connected devices
```

> **NON-NEGOTIABLE SECURITY RULES**:
> 1. The frontend is **NEVER** trusted to confirm payment.
> 2. Membership is **NEVER** activated merely because the client checkout script returned success.
> 3. Razorpay Key Secret is **NEVER** exposed to the frontend or saved in MongoDB.

---

## 🔄 Multi-Device Consistency — Absolute Requirement

MongoDB Atlas is the **SINGLE SOURCE OF TRUTH**.
- `localStorage` is **NEVER** used as the source of truth for:
  - Memberships
  - Digital passes
  - Payments
  - Members
  - Attendance
  - Expiry dates
- If **Device A** modifies or renews a pass (`30 September → 30 October`), **Device B, C, and D** will immediately receive `30 October` upon opening the profile or fetching the record, never stale data.
- All dynamic routes serve `Cache-Control: no-store, no-cache, must-revalidate` headers.
- The UI provides a real-time **Sync** trigger and timestamp display demonstrating server state refetches.

---

## 🕶️ Admin Panel Privacy

- The public website contains **ABSOLUTELY ZERO** references to the administrative console.
  - **No** admin link
  - **No** admin button
  - **No** admin login link
  - **No** admin footer navigation
  - **No** admin credentials or hints on public pages
- The Admin Console exists strictly behind `/admin` and `/admin/login`, accessible only via direct URL entry and protected by JWT authentication middleware.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Root project
npm install

# Frontend
cd gym-management-system
npm install

# Backend
cd server
npm install
```

### 2. Configure Environment
```bash
# Inside gym-management-system/server:
cp .env.example .env
# Edit .env with your credentials (or test with built-in zero-config sandbox)
```

### 3. Seed Database
Seeds default admin credentials, plans, trainers, and sample members:
```bash
npm run seed --prefix gym-management-system/server
```

**Default Admin Credentials:**
- **URL**: `http://localhost:5173/admin` (or `/admin/login`)
- **Email**: `admin@apexfit.com`
- **Password**: `Admin@123456`

**Sample Members for Testing:**
- `AF-1001` (Active Member — Arjun Verma)
- `AF-1002` (Expired Member — Priya Nair)
- `AF-1003` (New Inactive Member — Kabir Das)

### 4. Start Development Servers
```bash
# Start backend API (Port 5000)
npm run start:server

# In a separate terminal, start frontend (Port 5173)
npm run start:client
```

---

## 🧪 Production Verification Test Suite

Run the automated production test suite verifying all 16 specification requirements:

```bash
npm run test:flow
```

### Verified Criteria (16/16 Passed):
1. ✅ Admin login & password hashing verification.
2. ✅ Create member with unique member code in MongoDB.
3. ✅ Create membership plan with pricing and duration.
4. ✅ Generate Razorpay order on backend.
5. ✅ Cryptographic signature tampering strictly rejected.
6. ✅ Server-side HMAC-SHA256 verification of authentic payments.
7. ✅ Payment record saved and updated in MongoDB.
8. ✅ Membership pass activated with accurate expiration date calculation.
9. ✅ Device B fetches member pass directly from MongoDB.
10. ✅ Device B receives updated pass and expiration date.
11. ✅ Pass renewal from Device B updates MongoDB.
12. ✅ Device A receives updated expiration date after server refetch.
13. ✅ Expired memberships correctly detected by server date comparison.
14. ✅ Accurate payment history in MongoDB with order & payment IDs.
15. ✅ Zero secrets appear in frontend build bundle.
16. ✅ Public website contains NO admin panel references or navigation.
#   a p e x f i t  
 