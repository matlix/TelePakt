# Security Specification: TelePakt Firestore Rules

## 1. Data Invariants
1. **User Identity & PII Isolation**: Documents at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. **Immutability of ID**: A user's `id` field must match their `request.auth.uid` and cannot be modified after creation.
3. **Beta Signups**: Visitors can register for the beta program via `/betaSignups/{signupId}` with valid email and platform. Reading or modifying signups is prohibited for non-admins.
4. **Default Deny**: All unspecified paths are closed by default (`match /{document=**} { allow read, write: if false; }`).

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. Unauthenticated read to `/users/alice123` -> PERMISSION_DENIED.
2. Authenticated user Bob attempting to read `/users/alice123` -> PERMISSION_DENIED.
3. Authenticated user Bob attempting to write `/users/alice123` -> PERMISSION_DENIED.
4. User Alice attempting to create `/users/alice123` with mismatched `id: 'mallory'` -> PERMISSION_DENIED.
5. User Alice attempting to create `/users/alice123` without required `email` -> PERMISSION_DENIED.
6. User Alice injecting 1MB payload into `name` -> PERMISSION_DENIED (enforces `.size() <= 128`).
7. User Alice injecting unknown ghost field `isAdmin: true` -> PERMISSION_DENIED.
8. Unauthenticated list query on `/users` -> PERMISSION_DENIED.
9. Attempt to create `/betaSignups/sub1` without `rodoConsent: true` -> PERMISSION_DENIED.
10. Attempt to read other users' `/betaSignups/{signupId}` -> PERMISSION_DENIED.
11. User attempting to update or delete someone else's beta signup -> PERMISSION_DENIED.
12. Attempt to write to arbitrary collection `/telepakt_secrets/keys` -> PERMISSION_DENIED.
