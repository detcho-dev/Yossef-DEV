// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAemoGMX1PHF55qUTh_5SZIrN3Y-QaqrWA",
  authDomain: "yossef-dev-216b0.firebaseapp.com",
  projectId: "yossef-dev-216b0",
  storageBucket: "yossef-dev-216b0.firebasestorage.app",
  messagingSenderId: "509948939620",
  appId: "1:509948939620:web:017b806e995bb114d8be71",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const loginError = document.getElementById("login-error");

// Login Function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadProjects();
  } catch (error) {
    loginError.textContent = "Error: " + error.message;
    loginError.style.display = "block";
  }
}

// Logout Function
async function logout() {
  await signOut(auth);
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("login-screen").style.display = "block";
}

// Load Projects
async function loadProjects() {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "projects"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${doc.id}</td>
            <td>${data.customerName}</td>
            <td>${data.projectName}</td>
            <td>${data.projectStatus}</td>
            <td>${data.supportStatus}</td>
            <td>${data.deploymentDate}</td>
            <td>${data.supportEndDate}</td>
            <td><a href="${data.url}" target="_blank" class="view-btn">View Website</a></td>
            <td class="actions">
                <button class="edit-btn" onclick="openEditModal('${doc.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteProject('${doc.id}')">Delete</button>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Search Functionality
function searchTable() {
  const input = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#table-body tr");

  rows.forEach((row) => {
    let match = false;
    const cells = row.querySelectorAll("td");

    cells.forEach((cell) => {
      if (cell.textContent.toLowerCase().includes(input)) {
        match = true;
      }
    });

    row.style.display = match ? "" : "none";
  });
}

// New Project Modal
function openNewProjectModal() {
  document.getElementById("new-project-modal").style.display = "block";
}

// Add New Project
async function addNewProject() {
  const id = document.getElementById("new-id").value;
  const customer = document.getElementById("new-customer").value;
  const projectName = document.getElementById("new-project-name").value;
  const status = document.getElementById("new-status").value;
  const supportStatus = document.getElementById("new-support-status").value;
  const deployment = document.getElementById("new-deployment").value;
  const supportEnd = document.getElementById("new-support-end").value;
  const url = document.getElementById("new-url").value;

  if (!id || !customer || !projectName || !url) {
    alert("Please fill all required fields");
    return;
  }

  try {
    await setDoc(doc(db, "projects", id), {
      customerName: customer,
      projectName: projectName,
      projectStatus: status,
      supportStatus: supportStatus,
      deploymentDate: deployment,
      supportEndDate: supportEnd,
      url: url,
    });

    closeModal("new-project-modal");
    loadProjects();
    alert("Project added successfully!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Edit Project Modal
async function openEditModal(id) {
  const docRef = doc(db, "projects", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-customer").value = data.customerName;
    document.getElementById("edit-project-name").value = data.projectName;
    document.getElementById("edit-status").value = data.projectStatus;
    document.getElementById("edit-support-status").value = data.supportStatus;
    document.getElementById("edit-deployment").value = data.deploymentDate;
    document.getElementById("edit-support-end").value = data.supportEndDate;
    document.getElementById("edit-url").value = data.url;

    document.getElementById("edit-project-modal").style.display = "block";
  }
}

// Update Project
async function updateProject() {
  const id = document.getElementById("edit-id").value;
  const customer = document.getElementById("edit-customer").value;
  const projectName = document.getElementById("edit-project-name").value;
  const status = document.getElementById("edit-status").value;
  const supportStatus = document.getElementById("edit-support-status").value;
  const deployment = document.getElementById("edit-deployment").value;
  const supportEnd = document.getElementById("edit-support-end").value;
  const url = document.getElementById("edit-url").value;

  try {
    await setDoc(
      doc(db, "projects", id),
      {
        customerName: customer,
        projectName: projectName,
        projectStatus: status,
        supportStatus: supportStatus,
        deploymentDate: deployment,
        supportEndDate: supportEnd,
        url: url,
      },
      { merge: true }
    );

    closeModal("edit-project-modal");
    loadProjects();
    alert("Project updated successfully!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Delete Project
async function deleteProject(id) {
  if (confirm("Are you sure you want to delete this project?")) {
    try {
      await deleteDoc(doc(db, "projects", id));
      loadProjects();
      alert("Project deleted successfully!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  }
}

// Close Modals
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Auth State Monitor
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadProjects();
  }
});
