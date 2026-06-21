<div align="center">

# 🖥️ ArtHub — Server

### *REST API powering the ArtHub art marketplace*

<br/>

[![Client Repo](https://img.shields.io/badge/🎨%20Client%20Repo-ArtHub-C2693F?style=for-the-badge)](https://github.com/u2404057-cuet/ArtHub)
[![Server Repo](https://img.shields.io/badge/📁%20Server%20Repo-ArtHub--server-1E1E1E?style=for-the-badge&logo=github)](https://github.com/u2404057-cuet/ArtHub-server)
[![Live Site](https://img.shields.io/badge/🌐%20Live%20Site-art--hub--sigma.vercel.app-7A9E8E?style=for-the-badge)](https://art-hub-sigma.vercel.app)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.3-47A248?style=flat-square&logo=mongodb)
![Stripe](https://img.shields.io/badge/Stripe-Webhook-635BFF?style=flat-square&logo=stripe)
![JWT](https://img.shields.io/badge/JWT-Secured-C2693F?style=flat-square)

</div>

---

## 📌 Overview

This is the **Express.js REST API** for ArtHub — a full-stack online art marketplace. It handles authentication, artwork CRUD, Stripe payments, subscription tiers, and admin operations. Everything lives in a single `index.js` file.

---

## 🗂️ API Endpoints

### General
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Health check |

### Artworks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/arts` | Public | Get all artworks (search, filter, sort, paginate) |
| GET | `/arts/my-arts` | Artist (JWT) | Get logged-in artist's artworks |
| GET | `/arts/:artId` | Public | Get single artwork by ID |
| POST | `/arts` | Artist (JWT) | Add new artwork |
| PUT | `/arts/:artId` | Artist (JWT) | Update own artwork |
| DELETE | `/arts/:artId` | Artist / Admin (JWT) | Delete artwork |

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns JWT |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users/me` | JWT | Get own profile |
| PUT | `/users/me` | JWT | Update own profile |
| GET | `/users/top-artists` | Public | Get top 3 artists by sales |

### Transactions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/transactions/my-purchases` | User (JWT) | Purchase history |
| GET | `/transactions/my-sales` | Artist (JWT) | Sales history |
| GET | `/transactions` | Admin (JWT) | All platform transactions |

### Comments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/arts/:id/comments` | Public | Get comments on artwork |
| POST | `/arts/:id/comments` | User (JWT) + must have purchased | Add comment |
| PUT | `/comments/:id` | JWT (own comment) | Edit comment |
| DELETE | `/comments/:id` | JWT (own comment) | Delete comment |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/users` | Admin (JWT) | Get all users |
| PATCH | `/admin/users/:id/role` | Admin (JWT) | Change user role |
| GET | `/admin/artworks` | Admin (JWT) | Get all artworks |
| DELETE | `/admin/artworks/:id` | Admin (JWT) | Delete any artwork |
| GET | `/admin/analytics` | Admin (JWT) | Platform stats |

### Stripe
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/stripe/create-checkout` | User (JWT) | Create artwork purchase session |
| POST | `/stripe/create-subscription` | User (JWT) | Create subscription upgrade session |
| POST | `/stripe/webhook` | Stripe only | Handle payment confirmation |

---

## 🚀 Run Locally

```bash
git clone https://github.com/u2404057-cuet/ArtHub-server.git
cd ArtHub-server
npm install
```

Create a `.env` file:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:3000
```

```bash
node index.js
```

Server runs on `http://localhost:8000`

---

## 📦 NPM Packages

| Package | Purpose |
|---------|---------|
| `express` ^5.2.1 | Web framework |
| `cors` ^2.8.6 | Cross-origin resource sharing |
| `mongodb` ^7.3.0 | MongoDB native driver |
| `dotenv` ^17.4.2 | Environment variables |
| `jsonwebtoken` | JWT generation and verification |

---

## ⚙️ Key Implementation Notes

**Stripe Webhook** uses `express.raw()` and is registered **before** `express.json()` middleware — required for Stripe signature verification.

**JWT Middleware** (`verifyJWT`) reads the `Authorization: Bearer <token>` header and attaches decoded user data to `req.user` for downstream route handlers.

**Route ordering** — `/arts/my-arts` is defined **before** `/arts/:artId` to prevent Express treating `my-arts` as an ObjectId param.

**Subscription enforcement** — tier limits (Free: 3, Pro: 9, Premium: unlimited) are checked server-side before creating any Stripe Checkout session.

---

<div align="center">

*Part of the* **ArtHub** *full-stack project — CUET CSE*

[![GitHub](https://img.shields.io/badge/GitHub-u2404057--cuet-1E1E1E?style=flat-square&logo=github)](https://github.com/u2404057-cuet)

</div>
