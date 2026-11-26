// Firebase JS SDK (official CDN ES modules, works on static hosting such as GitHub Pages).
import { firebaseConfig, configured } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import * as A from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import * as F from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import * as S from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

let fb = {};
if (configured) {
  const app = initializeApp(firebaseConfig);
  fb = {
    auth: A.getAuth(app), db: F.getFirestore(app), storage: S.getStorage(app),
    setPersistence: A.setPersistence, browserLocalPersistence: A.browserLocalPersistence,
    onAuthStateChanged: A.onAuthStateChanged, signInWithPopup: A.signInWithPopup, signInWithRedirect: A.signInWithRedirect,
    getRedirectResult: A.getRedirectResult, GoogleAuthProvider: A.GoogleAuthProvider,
    createUserWithEmailAndPassword: A.createUserWithEmailAndPassword, signInWithEmailAndPassword: A.signInWithEmailAndPassword,
    signOut: A.signOut, updateProfile: A.updateProfile, sendEmailVerification: A.sendEmailVerification,
    collection: F.collection, doc: F.doc, getDoc: F.getDoc, setDoc: F.setDoc, deleteDoc: F.deleteDoc,
    onSnapshot: F.onSnapshot, query: F.query, where: F.where, or: F.or,
    ref: S.ref, uploadString: S.uploadString, getDownloadURL: S.getDownloadURL,
  };
}
export { fb, configured };
