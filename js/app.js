import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authContainer = document.getElementById("authContainer");
const topBar = document.getElementById("topBar");
const userName = document.getElementById("userName");
const treeContainer = document.getElementById("treeContainer");

// -------- Login / Logout --------
loginBtn.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); } catch (err) { console.error(err); }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  treeContainer.innerHTML = "";
  authContainer.classList.remove("hidden");
  topBar.classList.add("hidden");
});

// -------- Render Tree --------
async function renderTree() {
  const snapshot = await getDocs(collection(db, "people"));
  const people = {};
  snapshot.forEach(doc => people[doc.id] = { id: doc.id, ...doc.data() });

  // Find roots using start === true
  const roots = Object.values(people).filter(p => p.start === true);

  treeContainer.innerHTML = "";
  const rendered = new Set();

  roots.forEach(root => renderPerson(root, people, treeContainer, rendered));
}

function renderPerson(person, people, container, rendered) {
  if (rendered.has(person.id)) return;
  rendered.add(person.id);

  const card = createCard(person);

  // Spouse
  let spouse = person.spouseId ? people[person.spouseId] : null;
  let coupleWrapper = document.createElement("div");
  coupleWrapper.className = "flex flex-col items-center";

  if (spouse && !rendered.has(spouse.id)) {
    rendered.add(spouse.id);
    const spouseCard = createCard(spouse);
    const coupleRow = document.createElement("div");
    coupleRow.className = "flex items-center";

    coupleRow.appendChild(card);
    // Blue line between spouses
    const spouseLine = document.createElement("div");
    spouseLine.className = "spouse-line";
    coupleRow.appendChild(spouseLine);

    coupleRow.appendChild(spouseCard);
    coupleWrapper.appendChild(coupleRow);
  } else {
    coupleWrapper.appendChild(card);
  }

  container.appendChild(coupleWrapper);

  // Children
  const children = Object.values(people).filter(
    c => Array.isArray(c.parentId) && c.parentId.includes(person.id)
  );

  if (children.length) {
    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "flex flex-col items-center mt-4 space-y-2";

    // Green line down to children
    const lineDiv = document.createElement("div");
    lineDiv.className = "tree-line";
    childrenWrapper.appendChild(lineDiv);

    const childRow = document.createElement("div");
    childRow.className = "flex gap-6 mt-2";

    children.forEach(child => renderPerson(child, people, childRow, rendered));

    childrenWrapper.appendChild(childRow);
    container.appendChild(childrenWrapper);
  }
}

function createCard(person) {
  let dobText = "";
  if (person.dob instanceof Timestamp) {
    dobText = person.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } else dobText = person.dob || "";

  const card = document.createElement("div");
  card.className = "tree-card";
  card.innerHTML = `
    <h2 class="font-semibold text-gray-800">${person.name}</h2>
    ${dobText ? `<p class="text-gray-500 text-sm">${dobText}</p>` : ""}
  `;
  return card;
}

// -------- Auth State --------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authContainer.classList.add("hidden");
    topBar.classList.remove("hidden");
    userName.textContent = user.displayName || user.email;
    await renderTree();
  } else {
    authContainer.classList.remove("hidden");
    topBar.classList.add("hidden");
    treeContainer.innerHTML = "";
  }
});
