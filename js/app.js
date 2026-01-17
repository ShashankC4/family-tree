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
  if (renderedPeople.has(person.id)) return;
  renderedPeople.add(person.id);

  // Create parent card
  const card = document.createElement("div");
  card.className = "bg-white rounded-xl shadow-md p-4 flex flex-col items-center";
  const dobText = person.dob instanceof Timestamp
    ? person.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : person.dob || "";
  card.innerHTML = `<h2 class="font-semibold text-lg text-gray-800">${person.name}</h2>${dobText ? `<p class="text-gray-500 text-sm">${dobText}</p>` : ""}`;

  // Handle spouse
  let spouse = person.spouseId ? people[person.spouseId] : null;
  let coupleContainer = document.createElement("div");
  coupleContainer.className = "couple-wrapper";

  coupleContainer.appendChild(card);

  if (spouse) {
    renderedPeople.add(spouse.id);
    const spouseCard = document.createElement("div");
    spouseCard.className = "bg-white rounded-xl shadow-md p-4 flex flex-col items-center";
    const spouseDob = spouse.dob instanceof Timestamp
      ? spouse.dob.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : spouse.dob || "";
    spouseCard.innerHTML = `<h2 class="font-semibold text-lg text-gray-800">${spouse.name}</h2>${spouseDob ? `<p class="text-gray-500 text-sm">${spouseDob}</p>` : ""}`;

    coupleContainer.appendChild(spouseCard);

    // Add horizontal line between spouses
    const line = document.createElement("div");
    line.className = "spouse-line";
    coupleContainer.insertBefore(line, spouseCard); // line between the two
  }

  container.appendChild(coupleContainer);

  // Find children
  const children = Object.values(people).filter(
    p => Array.isArray(p.parentIds) && p.parentIds.includes(person.id)
  );

  if (children.length) {
    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "children-wrapper";

    // Vertical line from couple to children
    const parentLine = document.createElement("div");
    parentLine.className = "tree-line";
    childrenWrapper.appendChild(parentLine);

    const childRow = document.createElement("div");
    childRow.className = "child-row";

    children.forEach(child => renderPerson(child, people, childRow));
    childrenWrapper.appendChild(childRow);

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
