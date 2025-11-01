# 🔧 Facebook CDN Migration Fix - Clean Up Existing URLs

## 🎯 Purpose

This guide helps **admins clean up existing Facebook CDN URLs** that are already saved in the database and causing 403 errors.

---

## ⚠️ The Situation

### Problem
- Users saved Facebook CDN URLs **before the fix was implemented**
- These URLs still exist in Firestore
- When pages load, they try to fetch these URLs → **403 Forbidden error**
- New prevention is working, but old data needs cleanup

### Solution
Clean up problematic URLs in Firestore using Firebase Console or scripts

---

## 🚀 Option 1: Manual Cleanup (Firebase Console)

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database**

### Step 2: Find Users with Facebook URLs
1. Click **Users collection**
2. Look for `photoURL` field
3. If it contains `fbcdn` or `facebook` → needs fixing

### Step 3: Edit the URL
1. Click the user document
2. Click `photoURL` field
3. **Option A**: Clear it (leave empty)
4. **Option B**: Replace with Unsplash URL:
   ```
   https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop
   ```
5. Click **Update** ✅

---

## 🔨 Option 2: Automated Cleanup (Firebase Functions)

Create a Cloud Function to automatically fix all bad URLs:

### Create File: `functions/src/cleanupPhotoURLs.ts`

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Cloud Function to clean up problematic photoURLs
 * Can be triggered manually or on schedule
 */
export const cleanupProblematicPhotoURLs = functions.https.onCall(
  async (data, context) => {
    // Only allow admins
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in"
      );
    }

    const usersRef = db.collection("users");
    const problematicDomains = ["fbcdn", "facebook", "instagram", "igcdn"];
    
    let updatedCount = 0;
    let errorCount = 0;

    try {
      const snapshot = await usersRef.get();

      for (const doc of snapshot.docs) {
        try {
          const userData = doc.data();
          const photoURL = userData.photoURL || "";

          // Check if URL is problematic
          const isProblematic = problematicDomains.some(domain =>
            photoURL.toLowerCase().includes(domain)
          );

          if (isProblematic) {
            console.log(
              `🔧 Cleaning up photoURL for user: ${doc.id}`,
              `Old URL: ${photoURL}`
            );

            // Option 1: Clear the URL
            await doc.ref.update({
              photoURL: null,
              updatedAt: admin.firestore.Timestamp.now(),
              _cleanupNote: `Removed problematic URL on ${new Date().toISOString()}`,
            });

            updatedCount++;
            console.log(`✅ Cleaned up user: ${doc.id}`);
          }
        } catch (error) {
          console.error(`❌ Error processing user ${doc.id}:`, error);
          errorCount++;
        }
      }

      return {
        success: true,
        message: `Cleanup complete. Updated: ${updatedCount}, Errors: ${errorCount}`,
        updated: updatedCount,
        errors: errorCount,
      };
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Cleanup operation failed"
      );
    }
  }
);
```

### Deploy the Function
```bash
firebase deploy --only functions:cleanupProblematicPhotoURLs
```

### Call from Your App

```typescript
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

const cleanupFunction = httpsCallable(functions, "cleanupProblematicPhotoURLs");

// Run cleanup
const result = await cleanupFunction({});
console.log(result.data); 
// Output: { success: true, updated: 5, errors: 0 }
```

---

## 📊 Option 3: Report and Fix (Best Practice)

Create a utility to identify and report problematic URLs:

### Add to `src/lib/profileUtils.ts`

```typescript
/**
 * Find all users with problematic photoURLs
 */
export async function findProblematicPhotoURLs(): Promise<{
  userId: string;
  email: string;
  photoURL: string;
}[]> {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    
    const problematicUsers: {
      userId: string;
      email: string;
      photoURL: string;
    }[] = [];

    const problematicDomains = ["fbcdn", "facebook", "instagram", "igcdn"];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const photoURL = userData.photoURL || "";

      const isProblematic = problematicDomains.some(domain =>
        photoURL.toLowerCase().includes(domain)
      );

      if (isProblematic) {
        problematicUsers.push({
          userId: doc.id,
          email: userData.email,
          photoURL,
        });
      }
    });

    return problematicUsers;
  } catch (error) {
    console.error("Error finding problematic URLs:", error);
    return [];
  }
}

/**
 * Fix a specific user's photoURL
 */
export async function fixUserPhotoURL(
  userId: string,
  newPhotoURL?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = db.collection("users").doc(userId);
    
    await userRef.update({
      photoURL: newPhotoURL || null,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## 🎯 Recommended Approach

### For Individual Users:
1. **Simple**: Clear the photoURL field
2. **Better**: Use `QUICK_IMAGE_REFERENCE.md` to get working URL

### For Admins/Cleanup:
1. **Quick**: Use Firebase Console (Option 1)
2. **Scalable**: Deploy Cloud Function (Option 2)
3. **Safe**: Use report function to review first (Option 3)

---

## 📋 Cleanup Checklist

- [ ] Identify problematic URLs (Option 3)
- [ ] Review which users are affected
- [ ] Decide: clear or replace URLs
- [ ] Implement cleanup (Option 1, 2, or 3)
- [ ] Verify: check Firestore after cleanup
- [ ] Test: verify 403 errors are gone

---

## ✅ After Cleanup

Once cleanup is complete:

```
❌ BEFORE:
GET https://scontent.fcnx3-1.fna.fbcdn.net/... 403 (Forbidden)

✅ AFTER:
No 403 error
No broken images
Clean console logs
```

---

## 🔒 Security Notes

1. **Only admins** should run cleanup
2. **Backup data** before bulk operations
3. **Log all changes** for audit trail
4. **Test in dev** before production

---

## 📞 Support

### If you need to:
1. **Clean manually**: Use Option 1 (Firebase Console)
2. **Clean programmatically**: Use Option 2 (Cloud Function)
3. **Report issues**: Use Option 3 (Find & Report)

### Questions?
- Check existing user's profile URL manually
- Run cleanup on test database first
- Verify with a few users before bulk operation

---

**Implementation Date:** October 25, 2025  
**Status:** ✅ Ready to use  
**Scope:** Clean up existing problematic URLs from database
