# Authentication Plan — NestJS Backend

## Overview

Stateless authentication using a dual-token strategy. The server stores **no session state** — all session data lives on the client. Credentials are stored as:

| Data | Where stored | How |
|------|-------------|-----|
| Password | PostgreSQL `user.password_hash` | bcrypt hash (cost 10), never plaintext |
| Access token | Client (memory / LocalStorage) | JWT signed with `JWT_ACCESS_SECRET`, 15m TTL |
| Refresh token | Response body + Browser HttpOnly cookie | JWT signed with `JWT_REFRESH_SECRET`, 7d TTL |
| Session state | Nowhere on server | Stateless — verified via JWT signature only |

---

## Database Schema

```
user     : id (uuid PK), email (string UK), password_hash (string), created_at (timestamp)
article  : id (uuid PK), title, content_summary, source_url, created_at
history  : id (uuid PK), user_id (FK→user), article_id (FK→article), query_text, created_at
```

---

## Packages Installed

```bash
# ORM & DB
npm install @nestjs/typeorm typeorm pg

# Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser

# Validation
npm install class-validator class-transformer

# Types
npm install --save-dev @types/passport-jwt @types/bcrypt @types/cookie-parser
```

---

## File Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts         ← extracts + verifies Bearer token
│   └── guards/
│       └── jwt-auth.guard.ts       ← apply with @UseGuards(JwtAuthGuard)
├── user/
│   ├── user.module.ts
│   ├── user.service.ts
│   └── entities/
│       └── user.entity.ts
└── app.module.ts
```

---

## Environment Variables (repo root `.env.development`)

```
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.<project-ref>
DB_PASWORD=<password>              # note: one 's' — typo kept for consistency
DB_DATABASE=postgres

JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=<openssl rand -base64 64>
JWT_REFRESH_EXPIRES_IN=7d
```

env file loaded via `envFilePath: '../.env.development'` in `app.module.ts`.
Database: Supabase PostgreSQL via Transaction pooler (port `6543`).
SSL required. `prepareThreshold: 0` disables prepared statements (required for transaction pooler).

---

## API Endpoints

| Method | Path           | Auth Required | Description                                         |
|--------|----------------|---------------|-----------------------------------------------------|
| POST   | /auth/register | Public        | Create account, return both tokens + set cookie     |
| POST   | /auth/login    | Public        | Verify credentials, return both tokens + set cookie |
| POST   | /auth/refresh  | Cookie        | Rotate both tokens, return new pair + set cookie    |
| POST   | /auth/logout   | Public        | Clear refresh token cookie                          |

---

## Sequence: Register (`POST /auth/register`)

**Request body:** `{ email, password, confirmPassword }`

1. Validate DTO — `IsEmail`, `MinLength(8)`, `password === confirmPassword`
2. `UserService.findByEmail(email)` — if found → **409 Conflict**
3. `bcrypt.hash(password, 10)` — hash before storing
4. `UserService.create({ email, password_hash })` — INSERT into DB
5. Sign access token (JWT, 15m, `JWT_ACCESS_SECRET`)
6. Sign refresh token (JWT, 7d, `JWT_REFRESH_SECRET`)
7. `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
8. Return **201** `{ access_token, refresh_token, user: { id, email } }`

---

## Sequence: Login (`POST /auth/login`)

**Request body:** `{ email, password }`

1. `UserService.findByEmail(email)` — if not found → **401** `Invalid credentials`
2. `bcrypt.compare(password, user.password_hash)` — if false → **401** `Invalid credentials`
   - Same error message for both cases — prevents leaking which field failed
3. Sign access token + refresh token (same as register)
4. Set refresh token cookie
5. Return **200** `{ access_token, refresh_token, user: { id, email } }`

---

## Sequence: Token Refresh (`POST /auth/refresh`)

**Requires:** `refresh_token` HttpOnly cookie (sent automatically by browser)

Uses **token rotation** — both tokens are reissued on every call, extending the session window.

1. Read `refresh_token` from `req.cookies` — if missing → **401 Unauthorized**
2. `JwtService.verify(token, { secret: JWT_REFRESH_SECRET })` — if expired/invalid → **401**
3. `UserService.findById(payload.sub)` — if not found → **401**
4. Sign new access token (15m) + new refresh token (7d)
5. `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800` (replaces old cookie)
6. Return **200** `{ access_token, refresh_token }`

---

## Sequence: Logout (`POST /auth/logout`)

1. `res.clearCookie('refresh_token')` — sets `Max-Age=0`, browser deletes the cookie
2. Return **200** `{ message: 'Logged out successfully' }`

No DB write. The server never stored the token, so clearing the cookie is sufficient.
Client must also delete the access token from memory/LocalStorage.

---

## JWT Strategy (`src/auth/strategies/jwt.strategy.ts`)

- Extends `PassportStrategy(Strategy)` from `passport-jwt`
- Extracts Bearer token from `Authorization` header
- Verifies against `JWT_ACCESS_SECRET`
- `validate(payload)` returns `{ userId: payload.sub, email: payload.email }`
- Result is set as `req.user` on authenticated requests

---

## Bootstrap (`src/main.ts`)

```ts
app.use(cookieParser());
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

---

## Verification Steps

1. `npm run start:dev` — server starts on port 3000, TypeORM creates `user` table
2. `POST /auth/register` → 201, body has `access_token`, `refresh_token`, `user` + `Set-Cookie` header
3. `POST /auth/register` same email → 409
4. `POST /auth/login` valid credentials → 200, body has `access_token`, `refresh_token`, `user` + `Set-Cookie`
5. `POST /auth/login` wrong password → 401
6. `POST /auth/refresh` with valid cookie → 200, new `access_token` + `refresh_token` in body, new `Set-Cookie`
7. `POST /auth/refresh` without cookie → 401
8. `POST /auth/logout` → 200, `Set-Cookie` with empty value and `Max-Age=0`
