# Gaun Basti Stays Hub — Security & Architecture Audit

**Last Updated**: September 2026  
**Status**: Passed & Hardened (Phases 1, 2, & 3 Completed)

---

## Executive Summary

Gaun Basti is a rural tourism platform in Nepal connecting travelers with authentic local homestays, cottages, and cultural village experiences. This document outlines the security architecture, threat model, authorization controls, and risk mitigations implemented across the platform.

---

## 1. Authentication & Session Management

### 1.1 Secure Cookie + Bearer Token Dual Architecture
- **HttpOnly Cookies**: All authentication endpoints (`/api/auth/login`, `/api/auth/register`) set authentication tokens in `httpOnly`, `Secure` (production), and `SameSite` (Lax / None in cross-site production) cookies.
- **XSS Mitigation**: Storing tokens in `httpOnly` cookies prevents client-side JavaScript from accessing session credentials via malicious scripts.
- **Client Fallback**: For backward compatibility with mobile apps and existing test suites, tokens continue to be returned in API response bodies and accepted via `Authorization: Bearer <token>` headers.
- **Credentials Handling**: All frontend API requests explicitly send `credentials: 'include'` with strict CORS origin whitelisting.

### 1.2 Persistent Token Revocation
- **Architecture**: In-memory token blacklists have been upgraded to persistent MongoDB storage via the `RevokedToken` model.
- **Automated TTL Cleanup**: Uses MongoDB Time-To-Live index `{ expiresAt: 1 }, { expireAfterSeconds: 0 }` to automatically purge expired tokens without cron overhead.
- **Fast Path In-Memory Cache**: High-performance local caching checks recently revoked tokens in sub-millisecond memory lookups while remaining fully consistent across process restarts.

### 1.3 Account-Level Brute Force & Credential Stuffing Defense
- **IP Rate Limiting**: `loginLimiter` limits attempts per IP (max 5 per 15 minutes).
- **Account Lockout Mechanism**: Tracks consecutive failed login attempts on each `User` record (`failedLoginAttempts`).
- **15-Minute Lockout**: 5 consecutive invalid password submissions trigger an automatic account lock (`lockUntil`), returning HTTP 423 (Locked) even if an attacker routes requests through distributed proxy networks.
- **Registration Throttling**: `registerLimiter` enforces strict registration velocity limits (10 per hour per IP).

---

## 2. Authorization & Access Control

### 2.1 Server-Enforced RBAC
Frontend route protections are strictly UI conveniences. Every backend route verifies identity and role:
- **`guest`**: Can browse, book stays, manage own profile, review visited stays, and cancel own bookings.
- **`host`**: Can create/manage their own listings, view host analytics, manage incoming bookings for their listings, and request payouts.
- **`admin`**: Full platform oversight, host application approvals, listing verification, review moderation, and dispute resolution.

### 2.2 IDOR (Insecure Direct Object Reference) Protections
- **`requireOwnership` Middleware**: Verifies that the authenticated `req.user._id` matches the document's owner identifier (`host`, `guest`, or `payer`) before mutation.
- **ObjectId Validation**: `validateObjectId` sanitizes all URL parameters against valid 24-character hexadecimal MongoDB ObjectId patterns, preventing query manipulation and crashes.
- **Private Data Sanitization**: User model `toJSON()` and controller queries strip sensitive fields (`password`, `verificationToken`, `failedLoginAttempts`, `lockUntil`, `__v`) by default.

---

## 3. Booking & Financial Transaction Integrity

### 3.1 Double Booking & Race Condition Prevention
- **`BookingNight` Atomic Locking**: Individual stay dates are tracked in the `BookingNight` collection with a unique compound index `{ listing: 1, date: 1 }`.
- **MongoDB ACID Transactions**: Booking creation runs inside atomic sessions (`session.withTransaction`). Any overlapping booking attempt causes an immediate transaction rollback with HTTP 409 conflict.

### 3.2 Authoritative Server-Side Pricing
- **Zero Client Trust**: All fees (base rate $\times$ nights, cleaning fee, platform service fee rate, local taxes) are calculated server-side in `pricingConfig.ts`.
- **Client Tamper Rejection**: Any client attempting to forge or manipulate payment amounts is rejected during payment initialization (`ensureBookingIsPayable`).

### 3.3 Stripe Webhook & Payment Idempotency
- **Signature Verification**: Every incoming Stripe webhook is verified against `STRIPE_WEBHOOK_SECRET` using raw request payloads.
- **Replay Protection**: The `WebhookLog` collection tracks processed event IDs (`eventId`), deduplicating and neutralizing replay attacks.
- **Payment Idempotency**: Payment creation and refund requests require idempotency keys (`refund:<paymentId>:<amount>`).

### 3.4 Robust Refund Failure Audit & Reconciliation
- **No Silent Failures**: If a Stripe refund encounters an API error or network failure:
  1. The payment status transitions to `refund_failed` with explicit error notes.
  2. Failure is dispatched to `logPaymentFailure` monitoring for administrative alerting.
  3. The API response returns transparent status indicating the cancellation occurred but automated refund requires manual reconciliation.
  4. System prevents misleading users with false success confirmations.

---

## 4. Input Validation & Content Moderation

- **File Upload Security**: Cloudinary upload middleware uses strict mimetype filters (JPEG, PNG, WebP) and 10MB file size limits.
- **NoSQL Injection Defenses**: Mongoose schema casting and parameter validation prevent operator injection (e.g. `{"$gt": ""}`).
- **Regex ReDoS Protection**: User search queries are sanitized using `escapeRegex` to neutralize catastrophic backtracking patterns.
- **Automated Content Moderation**: AI review and message services inspect submitted content for spam, contact leakage, and abusive language before publishing.

---

## 5. Security Checklist Matrix

| Threat Category | Status | Mitigation Technique |
| :--- | :--- | :--- |
| **Broken Authentication** | Verified | HttpOnly cookies, JWT verification, TTL token revocation |
| **Credential Stuffing** | Verified | IP rate limiting + 5-attempt account lockout |
| **Privilege Escalation** | Verified | Backend RBAC, strict role guards, signup role whitelist |
| **IDOR** | Verified | `requireOwnership` middleware on listings, bookings, profiles |
| **Double Booking / Race Conditions** | Verified | Atomic `BookingNight` unique locks + ACID transactions |
| **Price Tampering** | Verified | Server-authoritative calculation via `pricingConfig` |
| **Webhook Replay** | Verified | Stripe signature validation + `WebhookLog` deduplication |
| **Refund Failure Silencing** | Verified | `refund_failed` state preservation + monitoring alerts |
| **XSS Vulnerabilities** | Verified | HttpOnly cookies + React output encoding |
| **Seed Data in Production** | Verified | Environment guard aborting execution in `production` |

---

*Gaun Basti Engineering Team — Security & Compliance Architecture*
