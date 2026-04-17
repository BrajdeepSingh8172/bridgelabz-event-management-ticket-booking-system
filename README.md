# 🎟️ Event Management & Ticket Booking System

<div align="center">

![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

A full-stack web application for managing events, ticket sales, and booking operations — built with the MERN stack.

*B.Tech CSE 3rd Year Project — GLA University, Mathura*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [Team](#-team)

---

## 🌐 Overview

Traditional event management relies on manual registration and physical ticket distribution — which is slow, error-prone, and hard to scale. This project solves that by providing a centralized digital platform where:

- **Organizers** can create and manage events with multiple ticket categories
- **Customers** can browse, filter, book tickets, and receive QR-coded digital tickets
- **Admins** can oversee the entire platform — users, revenue, analytics, and bookings

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎫 **Multi-Tier Tickets** | VIP, General, and Early Bird categories with individual pricing |
| ⚡ **Real-Time Availability** | Atomic DB operations prevent double-booking or overselling |
| 💳 **Razorpay Payments** | Secure payment with HMAC SHA256 webhook verification |
| 📱 **QR Code Tickets** | Unique QR code generated per confirmed booking |
| 🔐 **JWT Authentication** | Access & Refresh token flow with secure cookie handling |
| 👥 **Role-Based Access** | Separate dashboards for Admin, Organizer, and Customer |
| 📧 **Email Confirmation** | Automated HTML email with ticket details via Nodemailer |
| 📊 **Admin Dashboard** | Revenue reports, user management, and booking analytics |
| 🔍 **Search & Filter** | Browse events by category, date, location with pagination |
| ✅ **QR Check-In** | Organizers scan QR codes at the venue for entry verification |

---

## 🛠️ Tech Stack

### Frontend
- **React.js** — Component-based UI with hooks
- **React Router** — Client-side routing
- **Axios** — HTTP requests to the backend API
- **Tailwind CSS** — Utility-first styling

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — REST API framework
- **JWT** — Authentication with Access & Refresh tokens
- **Nodemailer** — Automated email delivery
- **qrcode** — QR code generation per booking
- **Helmet.js** — HTTP security headers
- **express-rate-limit** — API rate limiting

### Database
- **MongoDB Atlas** — Cloud NoSQL database
- **Mongoose** — ODM for schema modeling

### Payments
- **Razorpay** — Payment gateway with order creation and webhook-based verification

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│              React.js (Frontend SPA)                 │
│   Event Browsing │ Booking Flow │ Admin Dashboard    │
└──────────────────────┬──────────────────────────────┘
                       │  REST API Calls
┌──────────────────────▼──────────────────────────────┐
│                 Application Layer                    │
│           Node.js + Express.js (Backend)             │
│  JWT Auth │ RBAC │ Razorpay │ QR Gen │ Nodemailer   │
└──────────────────────┬──────────────────────────────┘
                       │  Mongoose ODM
┌──────────────────────▼──────────────────────────────┐
│                    Data Layer                        │
│                  MongoDB Atlas                       │
│   Users │ Events │ Bookings │ Payments               │
└─────────────────────────────────────────────────────┘
```

**Request Flow:**
`User` → `React Frontend` → `Express API` → `Payment Verification` → `MongoDB` → `QR + Email` → `User`

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MongoDB Atlas account
- Razorpay account (for API keys)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/event-management-ticket-booking.git
cd event-management-ticket-booking
```

**2. Install backend dependencies**
```bash
cd server
npm install
```

**3. Install frontend dependencies**
```bash
cd ../client
npm install
```

**4. Set up environment variables**

Create a `.env` file in the `/server` directory (see [Environment Variables](#-environment-variables)).

**5. Run the development servers**

In `/server`:
```bash
npm run dev
```

In `/client`:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:5000`.

---

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login and receive tokens | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | Logout and clear token | Private |

### Events
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events` | Get all events (with filters) | Public |
| GET | `/api/events/:id` | Get a single event | Public |
| POST | `/api/events` | Create a new event | Organizer |
| PUT | `/api/events/:id` | Update event details | Organizer |
| DELETE | `/api/events/:id` | Delete an event | Admin/Organizer |

### Bookings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bookings` | Create a booking | Customer |
| GET | `/api/bookings/my` | Get user's bookings | Customer |
| GET | `/api/bookings/:id` | Get booking details | Private |
| POST | `/api/bookings/checkin/:qr` | QR check-in at venue | Organizer |

### Payments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/payments/order` | Create Razorpay order | Customer |
| POST | `/api/payments/verify` | Verify payment signature | Customer |
| POST | `/api/payments/webhook` | Razorpay webhook handler | System |

### Admin
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/revenue` | Revenue analytics | Admin |
| GET | `/api/admin/bookings` | All booking records | Admin |
| DELETE | `/api/admin/users/:id` | Remove a user | Admin |

---

## 📁 Project Structure

```
event-management-ticket-booking/
│
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route-level page components
│       ├── context/            # Auth & global state context
│       ├── hooks/              # Custom React hooks
│       ├── services/           # Axios API service calls
│       └── utils/              # Helper functions
│
├── server/                     # Node.js + Express backend
│   ├── config/                 # DB connection, env config
│   ├── controllers/            # Route handler logic
│   ├── middleware/             # Auth, RBAC, error handling
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Booking.js
│   │   └── Payment.js
│   ├── routes/                 # Express route definitions
│   ├── services/               # QR generation, email, payment
│   ├── utils/                  # Validators, helpers
│   └── server.js               # Entry point
│
├── .gitignore
└── README.md
```

---

## 👥 User Roles

### 🛡️ Admin
- Full platform access
- Manage all users, events, and bookings
- View revenue reports and analytics
- Remove events or suspend users

### 🎪 Organizer
- Create and manage their own events
- Set ticket tiers (VIP, General, Early Bird) with pricing
- Scan QR codes for check-in at the venue
- View attendance and booking stats for their events

### 🙋 Customer
- Browse and search events
- Book tickets and make secure payments
- Receive QR-coded tickets via email
- View and manage their bookings

---

## 👨‍💻 Team

| Name |Roll No. |
|------|----------------|
| Brajdeep Singh | 2415990013 |
| Tanishq Vashishtha | 2315002286 |
| Shubham Chaudhary | 2315002138 |
| Siddharth Sharma | 2315002166 |
| Skand Rawat | 2315002171 |



---

## 📄 License

This project is developed for academic purposes at GLA University, Mathura.

