# Kisan Setu Firestore Security Specification

## Data Invariants
1. `mandiPatraks/{patrakId}` contains only public agricultural commodity market data (no PII). Every farmer (signed in or anonymous/public reader) may read verified bulletins, while ONLY verified admins (`email_verified == true` and allowlisted admin email or `admins/{uid}`) can create, update, or delete bulletins.
2. `userPreferences/{userId}` is strictly private to `request.auth.uid == userId` (`email_verified == true`).
3. `admins/{adminId}` is never writable from client SDKs; only readable by the matching signed-in user or admin.
4. `bazaarListings/{listingId}` is a shared public marketplace board for farmers and agrochemical shops. Reads are public so farmers can browse and contact dealers; creates/updates/deletes require a verified signed-in user (`email_verified == true`) with `authorUid == request.auth.uid` (and `isAdmin()` override for moderation). `likesCount` increments are bounded (`+1` per update).
5. `bazaarVideoChunks/{chunkDocId}` stores immutable `<750KB` base64 slices of uploaded reels; creates require `email_verified == true` and `authorUid == request.auth.uid`; updates are forbidden (`if false`); deletes require `isOwner(authorUid) || isAdmin()`.
6. All timestamps (`createdAt`, `updatedAt`) must equal `request.time`. All strings, numbers, and arrays enforce strict size and pattern limits.

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
11. Signed-in User A attempts `create` on `/bazaarListings/list-1` with spoofed `authorUid: "userB"` or extra shadow field `isSponsored: true`.
12. Signed-in User A attempts `update` or `delete` on User B's `/bazaarListings/list-B` (changing `title` or `contactPhone`) or mutates an immutable `/bazaarVideoChunks/chunk-1` document.
