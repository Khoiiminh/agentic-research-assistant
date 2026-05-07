# Authentication Workflows

## Overview

Authentication uses a **stateless dual-token strategy** — the server stores nothing in memory or database about active sessions. All session state lives on the client.

| Token | Lifetime | Where it lives | How it travels |
|-------|----------|----------------|----------------|
| Access token | 15 min | Client memory or LocalStorage | `Authorization: Bearer <token>` header |
| Refresh token | 7 days | Response body + Browser HttpOnly cookie | Returned in body on login/register; cookie sent automatically by browser |

Both tokens are signed JWTs with payload `{ sub: user.id, email }`. The server only needs the secrets to verify them — no session table, no Redis, no in-memory store.

---

## How Credentials Are Stored

### Password — stored as a bcrypt hash in PostgreSQL

The plaintext password is never saved. On register/login:
```
plaintext password ──► bcrypt.hash(password, 10) ──► $2b$10$... (stored in user.password_hash)
```
On login, `bcrypt.compare(plaintext, hash)` verifies the password without ever decrypting it. bcrypt is intentionally slow (cost factor 10) to resist brute-force attacks.

### Access Token — returned in response body, never stored on the server

After login/register, the server returns both tokens in the response body:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "..." }
}
```
The client stores the `access_token` — typically in memory or LocalStorage. On every protected API call, the client sends it in the header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
The server verifies the signature using `JWT_ACCESS_SECRET`. If valid and not expired, the request proceeds. **No database lookup is needed** — the token is self-contained.

### Refresh Token — returned in response body AND set as an HttpOnly cookie

After login/register, the `refresh_token` appears in the JSON response body and is also set via `Set-Cookie`:
```
Set-Cookie: refresh_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

Key properties of this cookie:
- **HttpOnly** — JavaScript cannot read it (`document.cookie` does not expose it). Protects against XSS attacks stealing the token.
- **Secure** — only sent over HTTPS. Never transmitted in plaintext.
- **SameSite=Strict** — only sent on same-site requests. Protects against CSRF attacks.
- **Max-Age=7d** — the browser automatically discards it after 7 days.

The server never stores the refresh token. Both delivery mechanisms (body + cookie) give the client flexibility: browser-based clients can rely on the automatic cookie, while other clients can use the value from the response body.

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
  |                               |<-- { id, email, created_at } - |
  |                               |                                |
  |                               | sign access_token (JWT, 15m)   |
  |                               | sign refresh_token (JWT, 7d)   |
  |                               |                                |
  |<-- 201 Created -------------- |                                |
  |    Set-Cookie: refresh_token  | ← stored in browser cookie jar|
  |    { access_token,            | ← client stores in memory/LS  |
  |      refresh_token, user }    |                                |
```

**What is stored where after register:**
- PostgreSQL: `{ id, email, password_hash, created_at }` — no token stored
- Browser cookie jar: `refresh_token` (HttpOnly, inaccessible to JS)
- Client app: `access_token` (in memory or LocalStorage)
- Server memory: nothing

**Error cases:**
- Passwords do not match → **400 Bad Request**
- Email already registered → **409 Conflict**
- Invalid/missing fields → **400 Bad Request** (class-validator)

---

## 2. Login

**Endpoint:** `POST /auth/login`

```
Client                          NestJS                         PostgreSQL
  |                               |                                |
  |-- POST /auth/login ---------->|                                |
  |   { email, password }         |                                |
  |                               |-- SELECT WHERE email = ? ----> |
  |                               |<-- { id, email, password_hash }|
  |                               |                                |
  |                               | bcrypt.compare(                |
  |                               |   password, password_hash)     |
  |                               |                                |
  |                               | sign access_token (JWT, 15m)   |
  |                               | sign refresh_token (JWT, 7d)   |
  |                               |                                |
  |<-- 200 OK ------------------- |                                |
  |    Set-Cookie: refresh_token  | ← replaces previous cookie     |
  |    { access_token,            | ← client updates stored tokens |
  |      refresh_token, user }    |                                |
```

**Error cases (both return the same message — never reveal which field failed):**
- Email not found → **401 Unauthorized** `Invalid credentials`
- Wrong password → **401 Unauthorized** `Invalid credentials`

---

## 3. Accessing a Protected Route

```
Client                          NestJS
  |                               |
  |-- GET /some-route ----------->|
  |   Authorization: Bearer <at>  |
  |                               | JwtAuthGuard extracts token
  |                               | JwtStrategy.verify(token, JWT_ACCESS_SECRET)
  |                               | payload = { sub, email, iat, exp }
  |                               | req.user = { userId, email }
  |                               |
  |<-- 200 OK ------------------- |
```

The server does **not** query the database to validate the access token — the JWT signature is sufficient. The database is only hit if the route handler explicitly fetches data.

---

## 4. Token Refresh

**Endpoint:** `POST /auth/refresh`

Called when the access token expires (client receives 401 on a protected route). Uses **token rotation** — both tokens are reissued on every refresh, and the cookie is replaced with a fresh 7-day window.

```
Client                          NestJS                         PostgreSQL
  |                               |                                |
  |-- POST /auth/refresh -------> |                                |
  |   Cookie: refresh_token=...   | ← browser sends automatically |
  |   (no body needed)            |                                |
  |                               | read cookie from request       |
  |                               | verify(token, JWT_REFRESH_SECRET)
  |                               | payload = { sub, email }       |
  |                               |                                |
  |                               |-- SELECT WHERE id = sub -----> |
  |                               |<-- user record --------------- |
  |                               |                                |
  |                               | sign new access_token (15m)    |
  |                               | sign new refresh_token (7d)    |
  |                               |                                |
  |<-- 200 OK ------------------- |                                |
  |    Set-Cookie: refresh_token  | ← cookie replaced, 7d reset   |
  |    { access_token,            | ← client replaces stored tokens|
  |      refresh_token }          |                                |
```

The DB lookup confirms the user still exists (e.g. account not deleted). Token rotation means the old refresh token is invalidated implicitly — a new one is issued with a fresh 7-day expiry on every call.

**Error cases:**
- Cookie missing → **401 Unauthorized**
- Token expired or signature invalid → **401 Unauthorized**
- User no longer exists in DB → **401 Unauthorized**

---

## 5. Logout

**Endpoint:** `POST /auth/logout`

```
Client                          NestJS
  |                               |
  |-- POST /auth/logout --------> |
  |                               | res.clearCookie('refresh_token')
  |                               | sets Max-Age=0 on the cookie
  |                               |
  |<-- 200 OK ------------------- |
  |    Set-Cookie: refresh_token= | ← browser deletes the cookie
  |    (empty, Max-Age=0)         |
  |    { message: "Logged out" }  |
```

**Why no server-side action is needed:**
The server never stored the refresh token, so there is nothing to delete. Logout works purely by telling the browser to expire the cookie. Once the cookie is gone, `POST /auth/refresh` will return 401, effectively ending the session.

The client should also delete the access token from memory/LocalStorage on logout.

---

## 6. Protecting Routes

Apply `JwtAuthGuard` to any controller method that requires authentication:

```ts
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() req) {
    // req.user = { userId: string, email: string }
}
```

Returns **401 Unauthorized** automatically for missing, expired, or tampered tokens — no extra code needed.

---

## Token Lifecycle Summary

```
Register / Login
      │
      ├──► access_token (15m)
      │      returned: response body
      │      stored: client memory/LocalStorage
      │      sent: Authorization: Bearer header
      │      verified: JWT signature only (no DB)
      │
      └──► refresh_token (7d)
             returned: response body + Set-Cookie (HttpOnly)
             stored: client storage + browser cookie jar
             verified: JWT signature only (no DB)

access_token expires → 401 on protected route
      │
      ▼
POST /auth/refresh (cookie sent automatically by browser)
      │
      ├──► new access_token (15m)    → client replaces stored token
      └──► new refresh_token (7d)    → cookie replaced, 7d window resets

refresh_token expires or logout
      │
      ▼
POST /auth/login ──► start over
```

---

## Security Properties

| Threat | Mitigation |
|--------|------------|
| XSS steals refresh token | HttpOnly cookie — JS cannot access it |
| CSRF uses refresh token | SameSite=Strict — cross-site requests excluded |
| XSS steals access token | Short 15m lifetime limits exposure window |
| Brute-force password | bcrypt cost factor 10 — ~100ms per attempt |
| Token forgery | Separate secrets for access and refresh tokens |
| Plaintext password leak | Only `password_hash` stored in DB, never plaintext |
