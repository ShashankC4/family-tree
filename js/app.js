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

  // -------- Render Family Tree --------
  async function renderPeople() {
    const peopleCol = collection(db, "people");
    const snapshot = await getDocs(peopleCol);

    // Build map of docId → person object
    const peopleMap = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      peopleMap[doc.id] = { id: doc.id, ...data, children: [] };
    });

    // Assign children to parents
    const roots = [];
    Object.values(peopleMap).forEach(person => {
      if (person.parentIds?.length) {
        person.parentIds.forEach(pid => {
          if (peopleMap[pid]) peopleMap[pid].children.push(person);
        });
      } else {
        roots.push(person); // no parents → root
      }
    });

    // Clear container
    cardsContainer.innerHTML = "";

    // Recursive function to create nodes
    function createPersonNode(person) {
      const node = document.createElement("div");
      node.className = "pl-4 border-l-2 border-gray-300 mb-4";

      const dobText = person.dob || "";
      const parentsText = person.parentIds?.length
        ? "Parent(s): " + person.parentIds.map(pid => peopleMap[pid]?.name || "Unknown").join(", ")
        : "No parents listed";

      node.innerHTML = `
        <div class="bg-white shadow-md rounded-xl p-4 mb-2 hover:shadow-lg transition duration-200">
          <h2 class="font-bold text-lg text-gray-800">${person.name}</h2>
          ${dobText ? `<p class="text-gray-500 text-sm mb-1">DOB: ${dobText}</p>` : ""}
          ${person.notes ? `<p class="text-gray-600 text-sm mb-1">${person.notes}</p>` : ""}
          <p class="text-gray-700 text-sm">${parentsText}</p>
        </div>
      `;

      // Render children
      if (person.children?.length) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "pl-6 border-l-2 border-gray-200";
        person.children.forEach(child => {
          childrenContainer.appendChild(createPersonNode(child));
        });
        node.appendChild(childrenContainer);
      }

      return node;
    }

    // Append roots to container
    roots.forEach(root => {
      cardsContainer.appendChild(createPersonNode(root));
    });

    // Populate parent dropdown for Add Person form
    personParents.innerHTML = "";
    snapshot.forEach(doc => {
      const opt = document.createElement("option");
      opt.value = doc.id;
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
        dob, // store as string
        notes,
        parentIds
      });

      // Clear form
      personName.value = "";
      personDob.value = "";
      personNotes.value = "";
      personParents.selectedIndex = -1;
      addPersonForm.classList.add("hidden");

      // Refresh tree
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

      // Check if allowed
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