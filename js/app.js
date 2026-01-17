import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const treeContainer = document.getElementById("treeContainer");

// -------- Login / Logout --------
loginBtn.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); } catch (err) { console.error(err); }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  treeContainer.innerHTML = "";
});

// -------- Render Tree --------
async function renderTree() {
  const snapshot = await getDocs(collection(db, "people"));
  const people = {};
  snapshot.forEach(doc => people[doc.id] = { id: doc.id, ...doc.data() });

  // Find roots (people without parents)
  const roots = Object.values(people).filter(p => !p.parentIds || p.parentIds.length === 0);

  treeContainer.innerHTML = "";
  roots.forEach(root => renderPerson(root, people, treeContainer));
}

// Keep track of already rendered people
const renderedPeople = new Set();

function renderPerson(person, people, container) {
  if (renderedPeople.has(person.id)) return; // skip already rendered
  renderedPeople.add(person.id);

  const card = document.createElement("div");
  card.className = "bg-white rounded-xl shadow-md p-4 flex flex-col items-center";

  let dobText = "";
  if (person.dob instanceof Timestamp) {
    dobText = person.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } else {
    dobText = person.dob || "";
  }

  card.innerHTML = `<h2 class="font-semibold text-lg text-gray-800">${person.name}</h2>${dobText ? `<p class="text-gray-500 text-sm">${dobText}</p>` : ""}`;

  // Spouse
  let spouse = person.spouseId ? people[person.spouseId] : null;
  if (spouse) {
    renderedPeople.add(spouse.id); // mark spouse as rendered
    const spouseCard = document.createElement("div");
    spouseCard.className = "bg-white rounded-xl shadow-md p-4 flex flex-col items-center ml-4";

    let spouseDob = "";
    if (spouse.dob instanceof Timestamp) {
      spouseDob = spouse.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } else spouseDob = spouse.dob || "";

    spouseCard.innerHTML = `<h2 class="font-semibold text-lg text-gray-800">${spouse.name}</h2>${spouseDob ? `<p class="text-gray-500 text-sm">${spouseDob}</p>` : ""}`;

    const coupleWrapper = document.createElement("div");
    coupleWrapper.className = "flex items-center";
    coupleWrapper.appendChild(card);
    coupleWrapper.appendChild(spouseCard);

    const line = document.createElement("div");
    line.className = "spouse-line";
    coupleWrapper.appendChild(line);

    container.appendChild(coupleWrapper);
  } else {
    container.appendChild(card);
  }

  // Children
  const children = Object.values(people).filter(
    p => Array.isArray(p.parentIds) && p.parentIds.includes(person.id)
  );

  if (children.length) {
    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "flex flex-col items-center mt-2 space-y-2";

    const lineDiv = document.createElement("div");
    lineDiv.className = "tree-line";
    childrenWrapper.appendChild(lineDiv);

    const childCardsWrapper = document.createElement("div");
    childCardsWrapper.className = "flex gap-4 mt-2";

    children.forEach(child => renderPerson(child, people, childCardsWrapper));

    childrenWrapper.appendChild(childCardsWrapper);
    container.appendChild(childrenWrapper);
  }
}

// -------- Auth State --------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    await renderTree();
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    treeContainer.innerHTML = "";
  }
});
