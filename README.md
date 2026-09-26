# 🏋️ ApexFit — Gym Management System

> A production-ready MERN-based Gym Management System for managing members, memberships, attendance, payments, trainers, and secure administration.

## 🌐 Overview

**ApexFit** is a full-stack Gym Management System built using the MERN stack.

It provides a centralized platform for managing gym operations while maintaining secure authentication, verified online payments, and consistent data across multiple devices.

### Core Capabilities

- 👥 Member Management
- 🎫 Membership & Digital Passes
- 💳 Razorpay Payments
- 📊 Admin Dashboard
- 🏃 Attendance Management
- 👨‍🏫 Trainer Management
- 🔐 Secure Admin Authentication
- 🔄 Multi-Device Data Synchronization
- 📝 Payment & Membership History
- 📋 Audit Logging

---

# ✨ Features

## 👥 Member Management

- Create and manage members
- Unique member identification
- Detailed member profiles
- Search and filtering
- Active, expired and suspended membership states
- Membership history

## 🎫 Membership Management

- Create multiple membership plans
- Custom pricing and duration
- Assign memberships
- Activate memberships
- Renew memberships
- Extend memberships
- Track expiry dates
- Digital membership passes

## 💳 Razorpay Integration

- Razorpay Checkout
- Backend order creation
- Server-side payment verification
- HMAC-SHA256 signature verification
- Payment history
- Automatic membership activation/renewal

## 📊 Attendance

- Member check-in
- Check-out tracking
- Attendance history
- Daily attendance statistics

## 👨‍🏫 Trainer Management

- Add trainers
- Update trainer information
- Manage trainer records

## 🔐 Authentication & Security

- JWT authentication
- Password hashing with bcrypt
- Protected admin routes
- Server-side authorization
- Environment-based secrets
- Audit logging

---

# 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express.js
- REST APIs
- JWT
- bcrypt / bcryptjs

### Database

- MongoDB Atlas
- Mongoose

### Payments

- Razorpay

### Tools & Deployment

- Git
- GitHub
- Render

---

# 🏗️ Architecture

```text
┌─────────────────────────┐
│       React Frontend    │
│      Vite + Tailwind    │
└────────────┬────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────┐
│     Node.js + Express   │
│                         │
│ Authentication          │
│ Business Logic          │
│ Payment Verification    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      MongoDB Atlas      │
│                         │
│ Single Source of Truth  │
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│        Razorpay         │
│      Payment Gateway    │
└─────────────────────────┘
