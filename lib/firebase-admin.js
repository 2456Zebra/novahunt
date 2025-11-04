import admin from "firebase-admin";

let initialized = false;

export function initFirebaseAdminFromBase64(base64) {
  if (initialized) return admin;
  if (!base64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not set");
  }
  const jsonStr = Buffer.from(base64, "base64").toString("utf8");
  const serviceAccount = JSON.parse(jsonStr);

  // Prevent multiple initializations in serverless environments
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Optionally set storageBucket or databaseURL here if needed
      // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  initialized = true;
  return admin;
}

export function getFirestore(base64) {
  initFirebaseAdminFromBase64(base64);
  return admin.firestore();
}

export function getAuth(base64) {
  initFirebaseAdminFromBase64(base64);
  return admin.auth();

}