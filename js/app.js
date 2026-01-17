import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const appStatus = document.getElementById("appStatus");

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error(err);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userEmail.textContent = `Logged in as: ${user.email}`;

    // Check if user is in allowedUsers
    const q = query(collection(db, "allowedUsers"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      appStatus.textContent = "You are allowed to add family members!";
      // show Add Person button here
    } else {
      appStatus.textContent = "You are logged in but not allowed to add members.";
      // hide Add Person button
    }

  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userEmail.textContent = "";
    appStatus.textContent = "Not logged in";
  }
});