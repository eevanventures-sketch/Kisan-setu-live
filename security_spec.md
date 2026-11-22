# Kisan Setu Firestore Security Specification

## Data Invariants
1. `mandiPatraks/{patrakId}` contains only public agricultural commodity market data (no PII). Every farmer (signed in or anonymous/public reader) may read verified bulletins, while ONLY verified admins (`email_verified == true` and allowlisted admin email or `admins/{uid}`) can create, update, or delete bulletins.
2. `userPreferences/{userId}` is strictly private to `request.auth.uid == userId` (`email_verified == true`).
3. `admins/{adminId}` is never writable from client SDKs; only readable by the matching signed-in user or admin.
4. All timestamps (`updatedAt`) must equal `request.time`. All strings and arrays enforce strict size and pattern limits.

## Dirty Dozen Attack Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated client attempts `setDoc` on `/mandiPatraks/mp-vidisha-ganjbasoda__18-11-2026`.
2. Non-admin signed-in user attempts `create` on `/mandiPatraks/mp-vidisha-ganjbasoda__18-11-2026`.
3. Signed-in user with `email_verified: false` spoofing admin email attempts `create` on `/mandiPatraks/...`.
4. Admin attempts `create` on `/mandiPatraks/...` with extra shadow field `isVerified: true`.
5. Admin attempts `create` with spoofed `updatedByUid` not equal to `request.auth.uid`.
6. Admin attempts `create` with client-provided `updatedAt` instead of `request.time`.
7. Admin attempts `create` with invalid `arrivalUnit: "टन"` or empty `rows: []`.
8. Malicious client attempts `setDoc` with a 2KB oversized document ID.
9. User A attempts `get` or `update` on `/userPreferences/userB`.
10. User A attempts `list` on `/userPreferences` without filtering `userId == request.auth.uid`.
11. User attempts `create` on `/userPreferences/userA` with extra shadow field `isAdmin: true`.
12. Signed-in user attempts `setDoc` on `/admins/{uid}` to escalate privileges.
