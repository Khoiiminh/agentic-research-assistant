# Authentication Workflows

## Overview

Authentication uses a **dual-token strategy**:

| Token | Lifetime | Transport | Storage (client) |
|-------|----------|-----------|------------------|
| Access token | 15 minutes | `Authorization: Bearer <token>` header | Client memory / LocalStorage |
| Refresh token | 7 days | `Set-Cookie: refresh_token` (HttpOnly) | Browser cookie (not JS-accessible) |

Both tokens are signed JWTs with payload `{ sub: user.id, email }`. They use **separate secrets** so a leaked access token cannot be used to forge a refresh token.

---

## 1. Register

**Endpoint:** `POST /auth/register`

```
Client                          NestJS                         PostgreSQL
  |                               |                                |
  |-- POST /auth/register ------> |                                |
  |   { email, password,          |                                |
  |     confirmPassword }         |                                |
  |                               |-- SELECT WHERE email = ? ----> |
  |                               |<-- null (not found) ---------- |
  |                               |                                |
  |                               | bcrypt.hash(password, 10)      |
  |                               |                                |
  |                               |-- INSERT INTO "user" --------> |
  |                               |<-- user record --------------- |
  |                               |                                |
  |                               | sign access token (15m)        |
  |                               | sign refresh token (7d)        |
  |                               |                                |
  |<-- 201 Created -------------- |                                |
  |    Set-Cookie: refresh_token  |                                |
  |    { access_token, user }     |                                |
```

**Error cases:**
- `passwords do not match` → **400 Bad Request**
- `email already registered` → **409 Conflict**
- invalid/missing fields → **400 Bad Request** (class-validator)

---

## 2. Login

**Endpoint:** `POST /auth/login`

```
Client                          NestJS                         PostgreSQL
  |                               |                                |
  |-- POST /auth/login ---------->|                                |
  |   { email, password }         |                                |
  |                               |-- SELECT WHERE email = ? ----> |
  |                               |<-- user record --------------- |
  |                               |                                |
  |                               | bcrypt.compare(password,       |
  |                               |   user.password_hash)          |
  |                               |                                |
  |                               | sign access token (15m)        |
  |                               | sign refresh token (7d)        |
  |                               |                                |
  |<-- 200 OK ------------------- |                                |
  |    Set-Cookie: refresh_token  |                                |
  |    { access_token, user }     |                                |
```

**Error cases (both map to the same message to avoid leaking which field failed):**
- email not found → **401 Unauthorized** `Invalid credentials`
- wrong password → **401 Unauthorized** `Invalid credentials`

---

## 3. Token Refresh

**Endpoint:** `POST /auth/refresh`

Called automatically by the client when the access token expires (HTTP 401 on a protected route).

```
Client                          NestJS                         PostgreSQL
  |                               |                                |
  |-- POST /auth/refresh -------> |                                |
  |   Cookie: refresh_token=...   |                                |
  |                               | read cookie                    |
  |                               | jwtService.verify(token,       |
  |                               |   JWT_REFRESH_SECRET)          |
  |                               |                                |
  |                               |-- SELECT WHERE id = sub -----> |
  |                               |<-- user record --------------- |
  |                               |                                |
  |                               | sign new access token (15m)    |
  |                               |                                |
  |<-- 200 OK ------------------- |                                |
  |    { access_token }           |                                |
```

**Error cases:**
- cookie missing → **401 Unauthorized**
- token expired or tampered → **401 Unauthorized**
- user no longer exists → **401 Unauthorized**

---

## 4. Logout

**Endpoint:** `POST /auth/logout`

Stateless logout — no database write needed. The server clears the HttpOnly cookie by returning it with `maxAge=0`, making it immediately expire in the browser.

```
Client                          NestJS
  |                               |
  |-- POST /auth/logout --------> |
  |   Cookie: refresh_token=...   |
  |                               | res.clearCookie('refresh_token')
  |                               |
  |<-- 200 OK ------------------- |
  |    Set-Cookie: refresh_token= |
  |    (empty, maxAge=0)          |
  |    { message: "Logged out" }  |
```

The client should also discard the access token from memory/LocalStorage on receipt of this response.

---

## 5. Protecting Routes

Apply `JwtAuthGuard` to any controller method that requires authentication:

```ts
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() req) {
    // req.user = { userId, email }  (set by JwtStrategy.validate)
}
```

The guard validates the `Authorization: Bearer <access_token>` header using `JWT_ACCESS_SECRET`. A missing, expired, or invalid token returns **401 Unauthorized** automatically.

---

## Token Lifecycle Summary

```
Register / Login
      │
      ▼
access_token (15m) ──► use on every protected request
refresh_token (7d, HttpOnly cookie)
      │
      │  access_token expires
      ▼
POST /auth/refresh ──► new access_token
      │
      │  refresh_token expires (or user logs out)
      ▼
POST /auth/login  ──► start over
```
