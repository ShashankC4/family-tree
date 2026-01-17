import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const cardsContainer = document.getElementById("cardsContainer");

// -------- Login / Logout --------
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error(err);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  cardsContainer.innerHTML = "";   // Clear people
});

// -------- Render People --------
async function renderPeople() {
  const peopleCol = collection(db, "people");
  const snapshot = await getDocs(peopleCol);

  // Build map of ID -> name for parent lookup
  const peopleMap = {};
  snapshot.forEach(doc => {
    peopleMap[doc.id] = doc.data().name;
  });

  cardsContainer.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const dobText = data.dob || "";

    // Resolve parent names
    const parentsText = data.parentIds?.length
      ? "Parent(s): " + data.parentIds.map(pid => peopleMap[pid] || "Unknown").join(", ")
      : "";

    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow-md p-4";
    card.innerHTML = `
      <h2 class="font-semibold text-lg text-gray-800">${data.name}</h2>
      ${dobText ? `<p class="text-gray-500 text-sm mb-1">DOB: ${dobText}</p>` : ""}
      ${parentsText ? `<p class="text-gray-700 text-sm">${parentsText}</p>` : ""}
    `;
    cardsContainer.appendChild(card);
  });
}

// -------- Auth State --------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    await renderPeople();
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    cardsContainer.innerHTML = "";
  }
});