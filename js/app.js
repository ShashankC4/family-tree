document.addEventListener("DOMContentLoaded", () => {
import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const appStatus = document.getElementById("appStatus");
const cardsContainer = document.getElementById("cardsContainer");

const addPersonBtn = document.getElementById("addPersonBtn");
const addPersonForm = document.getElementById("addPersonForm");
const personName = document.getElementById("personName");
const personDob = document.getElementById("personDob");
const personNotes = document.getElementById("personNotes");
const personParents = document.getElementById("personParents");
const savePersonBtn = document.getElementById("savePersonBtn");

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
});

// -------- Render People Cards --------
async function renderPeople() {
  const peopleCol = collection(db, "people");
  const snapshot = await getDocs(peopleCol);

  // Build map of docId -> name for parent lookup
  const peopleMap = {};
  snapshot.forEach(doc => {
    peopleMap[doc.id] = doc.data().name;
  });

  cardsContainer.innerHTML = ""; // clear container

  snapshot.forEach(doc => {
    const data = doc.data();
    // Convert parentIds to names
    let parentsText = "No parents listed";
    if (data.parentIds?.length) {
      const parentNames = data.parentIds.map(id => peopleMap[id] || "Unknown");
      parentsText = "Parent(s): " + parentNames.join(", ");
    }

    // Build card
    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow-md p-4 flex flex-col items-center";
    card.innerHTML = `
      <h2 class="font-semibold text-lg text-gray-800">${data.name}</h2>
      ${data.dob ? `<p class="text-gray-500 text-sm">DOB: ${data.dob}</p>` : ""}
      ${data.notes ? `<p class="text-gray-600 mt-2 text-sm">${data.notes}</p>` : ""}
      <p class="text-gray-500 mt-1 text-sm">${parentsText}</p>
    `;
    cardsContainer.appendChild(card);
  });

  // Populate parent dropdown for Add Person form
  personParents.innerHTML = "";
  snapshot.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id; // store document ID
    opt.textContent = doc.data().name;
    personParents.appendChild(opt);
  });
}

// -------- Add Person Form --------
addPersonBtn.addEventListener("click", () => {
  addPersonForm.classList.toggle("hidden");
});

savePersonBtn.addEventListener("click", async () => {
  const name = personName.value.trim();
  const dob = personDob.value;
  const notes = personNotes.value.trim();
  const selectedOptions = Array.from(personParents.selectedOptions);
  const parentIds = selectedOptions.map(o => o.value);

  if (!name) return alert("Name is required");

  try {
    await addDoc(collection(db, "people"), {
      name,
      dob,
      notes,
      parentIds
    });

    // Clear form
    personName.value = "";
    personDob.value = "";
    personNotes.value = "";
    personParents.selectedIndex = -1;
    addPersonForm.classList.add("hidden");

    // Refresh cards
    renderPeople();
  } catch (err) {
    console.error(err);
    alert("Error adding person");
  }
});

// -------- Auth State Change --------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userEmail.textContent = `Logged in as: ${user.email}`;

    // Check if user is allowed
    const q = query(collection(db, "allowedUsers"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      appStatus.textContent = "You are allowed to add family members!";
      addPersonBtn.classList.remove("hidden");
      await renderPeople();
    } else {
      appStatus.textContent = "You are logged in but not allowed to add members.";
      addPersonBtn.classList.add("hidden");
    }

  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userEmail.textContent = "";
    appStatus.textContent = "Not logged in";
    addPersonBtn.classList.add("hidden");
  }
});
});