// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJHECpnJMz0s8MuwZjkEPeOLndMgPAkFo",
  authDomain: "family-tree-81190.firebaseapp.com",
  projectId: "family-tree-81190",
  storageBucket: "family-tree-81190.firebasestorage.app",
  messagingSenderId: "2791807739",
  appId: "1:2791807739:web:eaef5855acbb89bcde6e5e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services we will use
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);