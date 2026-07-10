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

// ==================== UI Helpers ====================

// Toast Notification
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  const toastIcon = toast.querySelector("i");
  
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;
  
  // Set icon based on type
  if (type === "success") {
    toastIcon.className = "fas fa-check-circle";
  } else if (type === "error") {
    toastIcon.className = "fas fa-exclamation-circle";
  } else {
    toastIcon.className = "fas fa-info-circle";
  }
  
  // Show toast
  toast.style.transform = "translateX(0)";
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(200%)";
  }, 3000);
}

// Show/Hide Loading
function showLoading() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.display = "flex";
    loadingScreen.style.opacity = "1";
  }
}

function hideLoading() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }
}

// ==================== Authentication ====================

// Login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");
  const loginBtn = document.getElementById("login-btn");

  if (!email || !password) {
    errorEl.textContent = "Please fill in all fields";
    errorEl.style.display = "block";
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    await signInWithEmailAndPassword(auth, email, password);
    
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    showToast("Welcome back! Login successful", "success");
    
    errorEl.style.display = "none";
    await loadProjects();
    
  } catch (error) {
    errorEl.textContent = getErrorMessage(error.code);
    errorEl.style.display = "block";
    showToast(getErrorMessage(error.code), "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
}

// Logout
async function logout() {
  try {
    await signOut(auth);
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
    showToast("Logged out successfully", "success");
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Error logging out", "error");
  }
}

// Error Message Handler
function getErrorMessage(code) {
  switch(code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    default:
      return 'Login failed. Please try again';
  }
}

// ==================== Support Date Handler ====================

function getSupportStatusText(endDateString) {
  // Handle unlimited support
  if (!endDateString || endDateString.trim().toLowerCase() === "un") {
    return "Unlimited Support";
  }

  // Convert DD-MM-YYYY to YYYY-MM-DD
  let formattedDate = endDateString;
  if (typeof endDateString === 'string' && endDateString.includes("-")) {
    const parts = endDateString.split("-");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      formattedDate = `${year}-${paddedMonth}-${paddedDay}`;
    }
  }

  const endDate = new Date(formattedDate);

  // Check if date is valid
  if (isNaN(endDate.getTime())) {
    return endDateString;
  }

  const now = new Date();
  const diffMs = endDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return endDate.toLocaleDateString('en-GB');
  } 
  else if (diffDays > 0) {
    return `Ends in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } 
  else if (diffDays === 0) {
    return "Ends today";
  } 
  else {
    const daysAgo = Math.abs(diffDays);
    return `Ended ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
  }
}

// ==================== Project Management ====================

// Load Projects
async function loadProjects() {
  const tableBody = document.getElementById("table-body");
  
  // Show skeleton loading
  tableBody.innerHTML = `
    <tr class="skeleton-row">
      <td colspan="10">
        <div class="skeleton-loading">
          <div class="skeleton-bar"></div>
          <div class="skeleton-bar"></div>
          <div class="skeleton-bar"></div>
        </div>
      </td>
    </tr>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state-inline" style="padding: 40px; text-align: center;">
              <i class="fas fa-folder-open" style="font-size: 48px; color: #4b5563; margin-bottom: 16px;"></i>
              <h3 style="margin-bottom: 8px;">No projects yet</h3>
              <p style="color: #9ca3af;">Create your first project to get started</p>
            </div>
          </td>
        </tr>
      `;
      updateStats();
      return;
    }

    const projects = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    // Sort projects by ID (or any other field)
    projects.sort((a, b) => a.id.localeCompare(b.id));

    projects.forEach((data) => {
      const row = createProjectRow(data.id, data);
      tableBody.appendChild(row);
    });

    attachActionButtons();
    updateStats();
    
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10">
          <div style="text-align: center; padding: 40px; color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3>Error Loading Projects</h3>
            <p>${error.message}</p>
          </div>
        </td>
      </tr>
    `;
    console.error("Error loading projects:", error);
    showToast("Error loading projects: " + error.message, "error");
  }
}

// Create Project Row
function createProjectRow(id, data) {
  // Support Status Badge
  const supportStatus = data.supportStatus || "Unknown";
  let supportStatusClass = "support-expired";
  let supportStatusIcon = "";
  
  if (supportStatus === "Active") {
    supportStatusClass = "support-active";
    supportStatusIcon = '<i class="fas fa-check-circle"></i>';
  } else if (supportStatus === "Expire Soon") {
    supportStatusClass = "support-expire-soon";
    supportStatusIcon = '<i class="fas fa-clock"></i>';
  } else if (supportStatus === "Expired") {
    supportStatusClass = "support-expired";
    supportStatusIcon = '<i class="fas fa-times-circle"></i>';
  }

  // Project Status Badge
  const projectStatus = data.projectStatus || "Unknown";
  let statusClass = "";
  let statusDotClass = "";
  
  switch(projectStatus) {
    case "Live":
      statusClass = "status-live";
      statusDotClass = "status-dot";
      break;
    case "Under Development":
      statusClass = "status-developing";
      statusDotClass = "status-dot";
      break;
    case "Closed":
      statusClass = "status-closed";
      statusDotClass = "status-dot";
      break;
    case "Fixing Bugs":
      statusClass = "status-fixing";
      statusDotClass = "status-dot";
      break;
  }

  const row = document.createElement("tr");
  row.setAttribute("data-id", id);
  row.setAttribute("data-search", `${id} ${data.customerName} ${data.projectName} ${projectStatus} ${supportStatus}`.toLowerCase());
  
  row.innerHTML = `
    <td>
      <span class="id-badge">#${id}</span>
    </td>
    <td>
      <div class="customer-info">
        <div class="customer-avatar">
          <i class="fas fa-building"></i>
        </div>
        <span>${data.customerName || "-"}</span>
      </div>
    </td>
    <td>
      <div class="project-name-cell">
        <span class="project-name">${data.projectName || "-"}</span>
      </div>
    </td>
    <td>
      <span class="status-badge ${statusClass}">
        <span class="${statusDotClass}"></span>
        ${projectStatus}
      </span>
    </td>
    <td>
      <span class="status-badge support-badge ${supportStatusClass}">
        ${supportStatusIcon}
        ${supportStatus}
      </span>
    </td>
    <td>${data.deploymentDate || "-"}</td>
    <td>
      <span class="support-end-date">${getSupportStatusText(data.supportEndDate)}</span>
    </td>
    <td>
      ${data.url ? 
        `<a href="${data.url}" target="_blank" class="website-link">
          <i class="fas fa-external-link-alt"></i>
          Visit
        </a>` : 
        '<span style="color: #6b7280;">-</span>'
      }
    </td>
    <td>
      <button class="btn-icon btn-copy" data-url="${data.url || ''}" data-id="${id}" title="Copy share link">
        <i class="fas fa-link"></i>
      </button>
    </td>
    <td>
      <div class="action-buttons">
        <button class="btn-icon btn-edit" data-id="${id}" title="Edit project">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon btn-delete" data-id="${id}" title="Delete project">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </td>
  `;
  
  return row;
}

// Update Statistics
function updateStats() {
  const rows = document.querySelectorAll('#table-body tr:not(.skeleton-row)');
  let total = 0, live = 0, expiringSoon = 0, expired = 0;
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 10) return; // Skip empty/invalid rows
    
    total++;
    
    const statusBadge = cells[3]?.querySelector('.status-badge');
    const supportBadge = cells[4]?.querySelector('.support-badge');
    
    if (statusBadge?.classList.contains('status-live')) live++;
    if (supportBadge?.classList.contains('support-expire-soon')) expiringSoon++;
    if (supportBadge?.classList.contains('support-expired')) expired++;
  });
  
  // Animate number changes
  animateNumber('total-projects', total);
  animateNumber('live-projects', live);
  animateNumber('expiring-support', expiringSoon);
  animateNumber('expired-support', expired);
  
  // Update sidebar badge
  const projectCount = document.getElementById('project-count');
  if (projectCount) {
    projectCount.textContent = total;
  }
}

// Animate Number Change
function animateNumber(elementId, newValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const currentValue = parseInt(element.textContent) || 0;
  const diff = newValue - currentValue;
  const duration = 500;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    const current = Math.round(currentValue + (diff * eased));
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  if (diff !== 0) {
    requestAnimationFrame(update);
  } else {
    element.textContent = newValue;
  }
}

// ==================== Search Functionality ====================

function searchTable() {
  const searchTerm = document.getElementById("search").value.trim().toLowerCase();
  const tableBody = document.getElementById("table-body");
  const noResultsDiv = document.getElementById("no-results");
  const createBtn = document.getElementById("create-with-id-btn");
  const clearSearchBtn = document.getElementById("clear-search");
  
  // Show/hide clear button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = searchTerm ? "flex" : "none";
  }
  
  noResultsDiv.style.display = "none";
  
  if (searchTerm === "") {
    document.querySelectorAll("#table-body tr").forEach(row => {
      row.style.display = "";
    });
    return;
  }

  let hasMatch = false;
  let matchedCount = 0;
  
  document.querySelectorAll("#table-body tr").forEach(row => {
    const searchData = row.getAttribute("data-search");
    if (searchData && searchData.includes(searchTerm)) {
      row.style.display = "";
      hasMatch = true;
      matchedCount++;
    } else {
      row.style.display = "none";
    }
  });

  // Show no results state
  if (!hasMatch) {
    noResultsDiv.style.display = "block";
    
    // Allow creating project with search term as ID if it looks like an ID
    if (searchTerm && !searchTerm.includes(" ") && searchTerm.length >= 2) {
      createBtn.innerHTML = `<i class="fas fa-plus"></i> Create project with ID: "${searchTerm}"`;
      createBtn.style.display = "inline-flex";
      createBtn.dataset.searchId = searchTerm;
    } else {
      createBtn.style.display = "none";
    }
  }
  
  // Update search results count notification
  if (searchTerm && hasMatch) {
    showToast(`Found ${matchedCount} project${matchedCount !== 1 ? 's' : ''}`, "info");
  }
}

// Debounced search
let searchTimeout;
document.getElementById("search")?.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchTable();
  }, 300);
});

// ==================== Modal Management ====================

// Open New Project Modal
function openNewProjectModal(id = "") {
  const modal = document.getElementById("new-project-modal");
  modal.style.display = "block";
  
  // Reset form
  document.getElementById("new-id").value = id;
  document.getElementById("new-customer").value = "";
  document.getElementById("new-project-name").value = "";
  document.getElementById("new-status").value = "Live";
  document.getElementById("new-support-status").value = "Active";
  document.getElementById("new-deployment").value = "";
  document.getElementById("new-support-end").value = "";
  document.getElementById("new-url").value = "";
  
  // Focus on ID field if empty, otherwise customer field
  if (id) {
    document.getElementById("new-customer").focus();
  } else {
    document.getElementById("new-id").focus();
  }
}

// Add New Project
async function addNewProject() {
  const id = document.getElementById("new-id").value.trim();
  const customer = document.getElementById("new-customer").value.trim();
  const projectName = document.getElementById("new-project-name").value.trim();
  const status = document.getElementById("new-status").value.trim();
  const supportStatus = document.getElementById("new-support-status").value.trim();
  const deployment = document.getElementById("new-deployment").value.trim();
  const supportEnd = document.getElementById("new-support-end").value.trim();
  const url = document.getElementById("new-url").value.trim();

  // Validation
  if (!id || !customer || !projectName || !url) {
    showToast("Please fill all required fields", "error");
    return;
  }

  // Validate URL
  try { 
    new URL(url); 
  } catch {
    showToast("Please enter a valid URL (e.g., https://example.com)", "error");
    return;
  }

  // Check if project ID already exists
  const existingDoc = await getDoc(doc(db, "projects", id));
  if (existingDoc.exists()) {
    showToast(`Project with ID "${id}" already exists!`, "error");
    return;
  }

  try {
    const addBtn = document.getElementById("add-project-btn");
    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
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
    await loadProjects();
    showToast(`Project "${projectName}" added successfully!`, "success");
    
  } catch (error) {
    showToast("Error: " + error.message, "error");
  } finally {
    const addBtn = document.getElementById("add-project-btn");
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Project';
    }
  }
}

// Open Edit Modal
async function openEditModal(id) {
  try {
    const modal = document.getElementById("edit-project-modal");
    modal.style.display = "block";
    
    // Show loading state in modal
    document.getElementById("edit-customer").value = "Loading...";
    document.getElementById("edit-project-name").value = "Loading...";
    
    const docRef = doc(db, "projects", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("edit-id").value = id;
      document.getElementById("edit-customer").value = data.customerName || "";
      document.getElementById("edit-project-name").value = data.projectName || "";
      document.getElementById("edit-status").value = data.projectStatus || "Live";
      document.getElementById("edit-support-status").value = data.supportStatus || "Active";
      document.getElementById("edit-deployment").value = data.deploymentDate || "";
      document.getElementById("edit-support-end").value = data.supportEndDate || "";
      document.getElementById("edit-url").value = data.url || "";
    } else {
      showToast("Project not found!", "error");
      closeModal("edit-project-modal");
    }
  } catch (error) {
    showToast("Error loading project: " + error.message, "error");
    closeModal("edit-project-modal");
  }
}

// Update Project
async function updateProject() {
  const id = document.getElementById("edit-id").value;
  const customer = document.getElementById("edit-customer").value.trim();
  const projectName = document.getElementById("edit-project-name").value.trim();
  const status = document.getElementById("edit-status").value.trim();
  const supportStatus = document.getElementById("edit-support-status").value.trim();
  const deployment = document.getElementById("edit-deployment").value.trim();
  const supportEnd = document.getElementById("edit-support-end").value.trim();
  const url = document.getElementById("edit-url").value.trim();

  if (!customer || !projectName || !url) {
    showToast("Please fill all required fields", "error");
    return;
  }

  try {
    const updateBtn = document.getElementById("update-project-btn");
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    await setDoc(doc(db, "projects", id), {
      customerName: customer,
      projectName: projectName,
      projectStatus: status,
      supportStatus: supportStatus,
      deploymentDate: deployment,
      supportEndDate: supportEnd,
      url: url,
    }, { merge: true });
    
    closeModal("edit-project-modal");
    await loadProjects();
    showToast(`Project "${projectName}" updated successfully!`, "success");
    
  } catch (error) {
    showToast("Error: " + error.message, "error");
  } finally {
    const updateBtn = document.getElementById("update-project-btn");
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  }
}

// Delete Project
async function deleteProject(id) {
  // Get project name for confirmation
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const projectName = row?.querySelector('.project-name')?.textContent || id;
  
  // Custom confirm dialog
  if (!confirm(`⚠️ Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    // Double confirmation for safety
    if (!confirm(`🗑️ Final confirmation: Delete "${projectName}" permanently?`)) {
      return;
    }
    
    await deleteDoc(doc(db, "projects", id));
    await loadProjects();
    showToast(`Project "${projectName}" deleted successfully!`, "success");
    
  } catch (error) {
    showToast("Error deleting project: " + error.message, "error");
  }
}

// Close Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

// ==================== Action Buttons ====================

function attachActionButtons() {
  // Copy Link buttons
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.removeEventListener('click', handleCopyLink);
    btn.addEventListener('click', handleCopyLink);
  });

  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.removeEventListener('click', handleEdit);
    btn.addEventListener('click', handleEdit);
  });

  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleDelete);
    btn.addEventListener('click', handleDelete);
  });
  
  // View Website links
  document.querySelectorAll('.website-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('href');
      if (!url || url === '#') {
        e.preventDefault();
        showToast("No website URL available", "error");
      }
    });
  });
}

// Event Handlers
function handleCopyLink(e) {
  e.preventDefault();
  const id = e.currentTarget.dataset.id;
  const url = e.currentTarget.dataset.url || 'https://example.com';
  const encoded = encodeURIComponent(url);
  const link = `https://detcho-dev.github.io/Yossef-DEV/port?url=${encoded}&id=${id}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      showToast("Link copied to clipboard!", "success");
    }).catch(() => {
      // Fallback for older browsers
      fallbackCopyText(link);
    });
  } else {
    fallbackCopyText(link);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast("Link copied to clipboard!", "success");
  } catch (err) {
    prompt("Copy this link:", text);
  }
  document.body.removeChild(textArea);
}

function handleEdit(e) {
  const id = e.currentTarget.dataset.id;
  if (id) {
    openEditModal(id);
  }
}

function handleDelete(e) {
  const id = e.currentTarget.dataset.id;
  if (id) {
    deleteProject(id);
  }
}

// ==================== Keyboard Shortcuts ====================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search')?.focus();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
      closeModal("new-project-modal");
      closeModal("edit-project-modal");
    }
    
    // Ctrl/Cmd + N to open new project modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      openNewProjectModal();
    }
  });
}

// ==================== Mobile Menu ====================

function setupMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    
    // Close sidebar when clicking outside
    if (mainContent) {
      mainContent.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
}

// ==================== Initialization ====================

document.addEventListener("DOMContentLoaded", () => {
  // Auth elements
  document.getElementById("login-btn")?.addEventListener("click", login);
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  
  // Enter key to login
  document.getElementById("password")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") login();
  });
  
  // Project management
  document.getElementById("new-project-btn")?.addEventListener("click", () => openNewProjectModal());
  document.getElementById("add-project-btn")?.addEventListener("click", addNewProject);
  document.getElementById("update-project-btn")?.addEventListener("click", updateProject);
  document.getElementById("refresh-btn")?.addEventListener("click", async () => {
    const refreshBtn = document.getElementById("refresh-btn");
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    
    await loadProjects();
    showToast("Data refreshed", "success");
    
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
  });
  
  // Create project from search
  document.getElementById("create-with-id-btn")?.addEventListener("click", (e) => {
    const id = e.currentTarget.dataset.searchId;
    if (id) {
      document.getElementById("search").value = "";
      document.getElementById("no-results").style.display = "none";
      document.getElementById("clear-search").style.display = "none";
      openNewProjectModal(id);
    }
  });
  
  // Clear search
  document.getElementById("clear-search")?.addEventListener("click", () => {
    document.getElementById("search").value = "";
    document.getElementById("clear-search").style.display = "none";
    searchTable();
    document.getElementById("search").focus();
  });
  
  // Close modals
  document.getElementById("close-new-modal")?.addEventListener("click", () => closeModal("new-project-modal"));
  document.getElementById("close-edit-modal")?.addEventListener("click", () => closeModal("edit-project-modal"));
  
  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal("new-project-modal");
      closeModal("edit-project-modal");
    }
  });
  
  // Setup mobile menu
  setupMobileMenu();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Hide loading screen after initial load
  hideLoading();
});

// ==================== Auth State Observer ====================

auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display = "flex";
    
    // Update user avatar if available
    const userAvatar = document.querySelector('.user-avatar i');
    if (userAvatar && user.email) {
      userAvatar.className = 'fas fa-user-check';
    }
    
    loadProjects();
  } else {
    // User is signed out
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
    
    // Clear form
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("login-error").style.display = "none";
  }
});

// ==================== Exports ====================

export {
  login,
  logout,
  openNewProjectModal,
  addNewProject,
  updateProject,
  deleteProject,
  searchTable,
  closeModal,
  loadProjects
};
