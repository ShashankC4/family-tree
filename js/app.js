import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginContainer = document.getElementById("loginContainer");
const appContainer = document.getElementById("appContainer");
const userName = document.getElementById("userName");
const treeContainer = document.getElementById("treeContainer");

let renderedPeople = new Set();

// -------- Login / Logout --------
loginBtn.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); } catch (err) { console.error(err); }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  treeContainer.innerHTML = "";
  renderedPeople.clear();
});

// -------- Render Tree --------
async function renderTree() {
  const snapshot = await getDocs(collection(db, "people"));
  const people = {};
  snapshot.forEach(doc => people[doc.id] = { id: doc.id, ...doc.data() });

  // Find roots (people without parents)
  const roots = Object.values(people).filter(p => !p.parentIds || p.parentIds.length === 0);

  treeContainer.innerHTML = "";
  renderedPeople.clear();
  roots.forEach(root => renderPerson(root, people, treeContainer));
}

function renderPerson(person, people, container) {
  if (renderedPeople.has(person.id)) return;
  renderedPeople.add(person.id);

  // Person card
  const card = document.createElement("div");
  card.className = "person-card";
  const dobText = person.dob instanceof Timestamp
    ? person.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : person.dob || "";
  card.innerHTML = `<h2 class="font-semibold text-lg text-gray-800">${person.name}</h2>${dobText ? `<p class="text-gray-500 text-sm">${dobText}</p>` : ""}`;

  // Spouse
  let spouse = person.spouseId ? people[person.spouseId] : null;
  let coupleWrapper = document.createElement("div");
  coupleWrapper.className = "generation-row";

  coupleWrapper.appendChild(card);

  if (spouse) {
    renderedPeople.add(spouse.id);
    const spouseCard = document.createElement("div");
    spouseCard.className = "person-card";
    const spouseDob = spouse.dob instanceof Timestamp
      ? spouse.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : spouse.dob || "";
    spouseCard.innerHTML = `<h2 class="font-semibold text-lg text-gray-800">${spouse.name}</h2>${spouseDob ? `<p class="text-gray-500 text-sm">${spouseDob}</p>` : ""}`;
    coupleWrapper.appendChild(spouseCard);

    // Blue line for spouses
    const line = document.createElement("div");
    line.className = "couple-line";
    coupleWrapper.appendChild(line);
  }

  container.appendChild(coupleWrapper);

  // Children
  const children = Object.values(people).filter(
    p => Array.isArray(p.parentIds) && p.parentIds.includes(person.id)
  );

  if (children.length) {
    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "children-wrapper flex flex-col items-center mt-2";

    // Green line to children
    const vLine = document.createElement("div");
    vLine.className = "parent-line";
    vLine.style.height = "24px";
    childrenWrapper.appendChild(vLine);

    const siblingRow = document.createElement("div");
    siblingRow.className = "generation-row";
    children.forEach(child => renderPerson(child, people, siblingRow));

    childrenWrapper.appendChild(siblingRow);
    container.appendChild(childrenWrapper);
  }
}

// -------- Auth State --------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    userName.textContent = user.displayName || user.email;
    await renderTree();
  } else {
    loginContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
    treeContainer.innerHTML = "";
    renderedPeople.clear();
  }
});
