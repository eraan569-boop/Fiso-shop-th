// ================================================================
// FIREBASE CONFIGURATION: the ONLY file you need to edit.
// Firebase Console → Project settings → Your apps → Web app → "SDK setup and configuration".
// These web values are identifiers, not secrets. Security comes from firestore.rules / storage.rules.
// Never put service-account keys or admin secrets in this project.
// ================================================================
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com', // use the exact value shown in the console
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// The 3 emails allowed to activate Owner access.
// MUST match the list inside firestore.rules (the rules are what actually enforce the limit).
export const OWNER_EMAILS = ['owner1@example.com', 'owner2@example.com', 'owner3@example.com'];

export const configured = !Object.values(firebaseConfig).some((v) => !v || /YOUR_/.test(v));
