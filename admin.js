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

// 🔑 استبدل هذه البيانات ببيانات مشروعك من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAemoGMX1PHF55qUTh_5SZIrN3Y-QaqrWA",
  authDomain: "yossef-dev-216b0.firebaseapp.com",
  projectId: "yossef-dev-216b0",
  storageBucket: "yossef-dev-216b0.firebasestorage.app",
  messagingSenderId: "509948939620",
  appId: "1:509948939620:web:017b806e995bb114d8be71",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🚪 Login Function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadProjects();
    errorEl.style.display = "none";
  } catch (error) {
    errorEl.textContent = "Error: " + error.message;
    errorEl.style.display = "block";
  }
}

// 🚪 Logout Function
async function logout() {
  try {
    await signOut(auth);
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// 📥 Load Projects from Firestore
async function loadProjects() {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML =
    '<tr><td colspan="9" style="text-align:center">Loading...</td></tr>';

  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML =
        '<tr><td colspan="9" style="text-align:center">No projects found</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${doc.id}</td>
        <td>${data.customerName || "-"}</td>
        <td>${data.projectName || "-"}</td>
        <td>${data.projectStatus || "-"}</td>
        <td>${data.supportStatus || "-"}</td>
        <td>${data.deploymentDate || "-"}</td>
        <td>${data.supportEndDate || "-"}</td>
        

        <td>
          ${
            data.url
              ? `<a href="${data.url}" target="_blank" class="view-btn">View Website</a>`
              : "-"
          }
        </td>
        <td class="actions">
          <button class="edit-btn" data-id="${doc.id}">Edit</button>
          <button class="delete-btn" data-id="${doc.id}">Delete</button>
        </td>
        <td>${supportStatusBadge}</td>
        <td>${statusWithDot}</td>
      `;

      // داخل loadProjects()، استبدل سطر supportStatus بـ:
      const supportStatusEl = data.supportStatus || "-";
      let supportStatusBadge = `<span class="support-status support-expired">Unknown</span>`;

      if (supportStatusEl === "Active") {
        supportStatusBadge = `<span class="support-status support-active">Active</span>`;
      } else if (supportStatusEl === "Expire Soon") {
        supportStatusBadge = `<span class="support-status support-expire-soon">Expire Soon</span>`;
      } else if (supportStatusEl === "Expired") {
        supportStatusBadge = `<span class="support-status support-expired">Expired</span>`;
      }

      // في الـ row.innerHTML:

      // بعد استخراج projectStatus
      const projectStatusEl = data.projectStatus || "Unknown";
      let statusWithDot = projectStatusEl;

      if (projectStatusEl === "Live") {
        statusWithDot = `<span class="status-live">${projectStatusEl}<span class="status-dot"></span></span>`;
      } else if (projectStatusEl === "Under Development") {
        statusWithDot = `<span class="status-developing">${projectStatusEl}<span class="status-dot"></span></span>`;
      } else if (projectStatusEl === "Closed") {
        statusWithDot = `<span class="status-closed">${projectStatusEl}<span class="status-dot"></span></span>`;
      } else if (projectStatusEl === "Fixing Bugs") {
        statusWithDot = `<span class="status-fixing">${projectStatusEl}<span class="status-dot"></span></span>`;
      }

      // في الـ row.innerHTML:

      tableBody.appendChild(row);
    });

    // ✅ ربط أزرار الإجراءات بعد التحميل
    attachActionButtons();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ff4444">Error loading data: ${error.message}</td></tr>`;
    console.error("Error loading projects:", error);
  }
}

// 🔍 Search Functionality
function searchTable() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#table-body tr");

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    let match = false;

    cells.forEach((cell) => {
      if (cell.textContent.toLowerCase().includes(searchTerm)) {
        match = true;
      }
    });

    row.style.display = match ? "" : "none";
  });
}

// ➕ Open New Project Modal
function openNewProjectModal() {
  document.getElementById("new-project-modal").style.display = "block";
}

// ➕ Add New Project
async function addNewProject() {
  const id = document.getElementById("new-id").value.trim();
  const customer = document.getElementById("new-customer").value.trim();
  const projectName = document.getElementById("new-project-name").value.trim();
  const status = document.getElementById("new-status").value.trim() || "Live";
  const supportStatus =
    document.getElementById("new-support-status").value.trim() || "Active";
  const deployment = document.getElementById("new-deployment").value.trim();
  const supportEnd = document.getElementById("new-support-end").value.trim();
  const url = document.getElementById("new-url").value.trim();

  // التحقق من الحقول الإلزامية
  if (!id || !customer || !projectName || !url) {
    alert("Please fill all required fields (ID, Customer, Project Name, URL)");
    return;
  }

  // التحقق من صحة الرابط
  try {
    new URL(url);
  } catch {
    alert("Please enter a valid URL (e.g., https://example.com)");
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
    alert("✅ Project added successfully!");
  } catch (error) {
    alert("❌ Error adding project: " + error.message);
  }
}

// ✏️ Open Edit Modal
async function openEditModal(id) {
  try {
    const docRef = doc(db, "projects", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("edit-id").value = id;
      document.getElementById("edit-customer").value = data.customerName || "";
      document.getElementById("edit-project-name").value =
        data.projectName || "";
      document.getElementById("edit-status").value = data.projectStatus || "";
      document.getElementById("edit-support-status").value =
        data.supportStatus || "";
      document.getElementById("edit-deployment").value =
        data.deploymentDate || "";
      document.getElementById("edit-support-end").value =
        data.supportEndDate || "";
      document.getElementById("edit-url").value = data.url || "";
      document.getElementById("edit-status").value =
        data.projectStatus || "Live";
      document.getElementById("edit-support-status").value =
        data.supportStatus || "Active";

      document.getElementById("edit-project-modal").style.display = "block";
    } else {
      alert("Document not found!");
    }
  } catch (error) {
    alert("Error loading project: " + error.message);
  }
}

// ✏️ Update Project
async function updateProject() {
  const id = document.getElementById("edit-id").value;
  const customer = document.getElementById("edit-customer").value.trim();
  const projectName = document.getElementById("edit-project-name").value.trim();
  const status = document.getElementById("edit-status").value.trim();
  const supportStatus = document
    .getElementById("edit-support-status")
    .value.trim();
  const deployment = document.getElementById("edit-deployment").value.trim();
  const supportEnd = document.getElementById("edit-support-end").value.trim();
  const url = document.getElementById("edit-url").value.trim();

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
    alert("✅ Project updated successfully!");
  } catch (error) {
    alert("❌ Error updating project: " + error.message);
  }
}

// 🗑️ Delete Project
async function deleteProject(id) {
  if (
    !confirm(
      "⚠️ Are you sure you want to delete this project? This action cannot be undone!"
    )
  )
    return;

  try {
    await deleteDoc(doc(db, "projects", id));
    loadProjects();
    alert("✅ Project deleted successfully!");
  } catch (error) {
    alert("❌ Error deleting project: " + error.message);
  }
}

// ❌ Close Modals
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// 🔗 Attach Action Buttons (للعناصر الديناميكية)
function attachActionButtons() {
  // جميع أزرار التعديل
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const projectId = e.target.dataset.id;
      openEditModal(projectId);
    });
  });

  // جميع أزرار الحذف
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const projectId = e.target.dataset.id;
      deleteProject(projectId);
    });
  });

  // جميع روابط المواقع
  document.querySelectorAll(".view-btn").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation(); // منع التعارض مع أحداث أخرى
    });
  });
}

// 🎯 ربط جميع الأحداث بعد تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  // أزرار الشاشة الرئيسية
  document.getElementById("login-btn")?.addEventListener("click", login);
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document
    .getElementById("new-project-btn")
    ?.addEventListener("click", openNewProjectModal);

  // مربع البحث
  document.getElementById("search")?.addEventListener("input", searchTable);

  // أزرار النماذج
  document
    .getElementById("add-project-btn")
    ?.addEventListener("click", addNewProject);
  document
    .getElementById("update-project-btn")
    ?.addEventListener("click", updateProject);

  // أزرار إغلاق النوافذ المنبثقة
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      const modal = closeBtn.closest(".modal");
      if (modal) modal.style.display = "none";
    });
  });

  // إغلاق النماذج عند الضغط خارجها
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
});

// 👤 مراقبة حالة تسجيل الدخول
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadProjects();
  } else {
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
  }
});

// 🚨 معالجة الأخطاء العامة
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error:", { message, source, lineno, colno, error });
  alert(`Critical error: ${message}\nCheck console for details`);
  return true; // منع الرسالة الافتراضية في الكونسول
};

// ✅ ضروري لأن الملف type="module"
export {
  login,
  logout,
  openNewProjectModal,
  addNewProject,
  updateProject,
  deleteProject,
  searchTable,
  closeModal,
};
