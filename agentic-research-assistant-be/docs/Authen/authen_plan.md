# Authentication Plan — NestJS Backend

## Overview

Implement Register, Login, Logout, and Token Refresh for the NestJS backend against PostgreSQL. Access tokens are short-lived JWTs sent in the response body; refresh tokens are long-lived JWTs stored in an HttpOnly cookie.

---

## Database Schema

```
user     : id (uuid PK), email (string UK), password_hash (string), created_at (timestamp)
article  : id (uuid PK), title, content_summary, source_url, created_at
history  : id (uuid PK), user_id (FK→user), article_id (FK→article), query_text, created_at
```

---

## Packages

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
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── user/
│   ├── user.module.ts
│   ├── user.service.ts
│   └── entities/
│       └── user.entity.ts
└── app.module.ts  (updated — wire TypeORM + AuthModule + UserModule)
```

---

## Environment Variables (.env.development)

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASWORD=postgres
DB_DATABASE=agentic_research

JWT_ACCESS_SECRET=<generate with: openssl rand -base64 64>
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=<generate with: openssl rand -base64 64>
JWT_REFRESH_EXPIRES_IN=7d
```

---

## API Endpoints

| Method | Path           | Auth Required | Description                        |
|--------|----------------|---------------|------------------------------------|
| POST   | /auth/register | Public        | Create account, return tokens      |
| POST   | /auth/login    | Public        | Verify credentials, return tokens  |
| POST   | /auth/logout   | Public        | Clear refresh token cookie         |
| POST   | /auth/refresh  | Cookie        | Issue new access token             |

---

## Sequence: Register (`POST /auth/register`)

**Request body:** `{ email, password, confirmPassword }`

1. Validate DTO (class-validator): `IsEmail`, `MinLength(8)`, passwords match
2. `UserService.findByEmail(email)` — if found → throw `ConflictException` (409)
3. `bcrypt.hash(password, 10)`
4. `UserService.create({ email, password_hash })`
5. Generate access token (JWT 15 min) + refresh token (JWT 7 days), payload: `{ sub: user.id, email }`
6. Set `refresh_token` cookie: `HttpOnly, Secure, SameSite=Strict, maxAge=7d`
7. Return **201** `{ access_token, user: { id, email } }`

**Error cases:**
- Email already exists → **409 Conflict**
- Validation failure → **400 Bad Request**

---

## Sequence: Login (`POST /auth/login`)

**Request body:** `{ email, password }`

1. `UserService.findByEmail(email)` — if not found → throw `UnauthorizedException` (401)
2. `bcrypt.compare(password, user.password_hash)` — if false → throw `UnauthorizedException` (401)
3. Generate access token + refresh token (same as register)
4. Set `refresh_token` cookie
5. Return **200** `{ access_token, user: { id, email } }`

**Error cases:**
- Invalid credentials (either wrong email or wrong password) → **401 Unauthorized** (same message — don't leak which field failed)

---

## Sequence: Token Refresh (`POST /auth/refresh`)

**Cookie required:** `refresh_token`

1. Read `refresh_token` from cookie
2. If missing → throw `UnauthorizedException` (401)
3. `JwtService.verify(token, { secret: JWT_REFRESH_SECRET })` — if expired/invalid → throw `UnauthorizedException` (401)
4. `UserService.findById(payload.sub)` — if not found → throw `UnauthorizedException` (401)
5. Generate new access token
6. Return **200** `{ access_token }`

---

## Sequence: Logout (`POST /auth/logout`)

1. Clear the `refresh_token` cookie by setting `maxAge: 0`
2. Return **200** `{ message: 'Logged out successfully' }`

No database writes needed — stateless cookie invalidation is sufficient for this use case.

---

## JWT Strategy

`JwtStrategy` (passport-jwt) extracts Bearer token from Authorization header:
- Verifies against `JWT_ACCESS_SECRET`
- `validate(payload)` returns `{ userId: payload.sub, email: payload.email }`
- Used by `JwtAuthGuard` to protect future routes

---

## Bootstrap Changes (main.ts)

```ts
app.use(cookieParser());
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

---

## Verification

1. `npm run start:dev` — server starts on port 3000
2. `POST /auth/register` `{ email, password, confirmPassword }` → 201 + access_token + Set-Cookie header
3. `POST /auth/register` same email → 409
4. `POST /auth/login` valid credentials → 200 + access_token + Set-Cookie header
5. `POST /auth/login` wrong password → 401
6. `POST /auth/refresh` with cookie → 200 new access_token
7. `POST /auth/logout` → 200, cookie cleared (empty value, maxAge=0)
8. `npm run test` — all unit tests pass
