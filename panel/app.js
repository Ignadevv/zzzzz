// ===== FIREBASE SETUP =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, query, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLQKlAQNAnW2v5n5EdzDxW465a_Bgx8tU",
  authDomain: "anacleto-dcba8.firebaseapp.com",
  projectId: "anacleto-dcba8",
  storageBucket: "anacleto-dcba8.firebasestorage.app",
  messagingSenderId: "479401040293",
  appId: "1:479401040293:web:cc8bfaa40a23464a30704c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== GLOBAL STATE =====
let allOrders = [];
let allClients = [];
let currentFilter = "todos";
let currentWizardStep = 1;
let falloCounter = 0;
let piezaCounter = 0;

// ===== AUTH GUARD =====
onAuthStateChanged(auth, function(user) {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-name").textContent = user.email.split("@")[0];
  document.getElementById("user-avatar").textContent = user.email.charAt(0).toUpperCase();
  loadAllData();
});

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast toast-" + (type || "success") + " show";
  setTimeout(function() { t.classList.remove("show"); }, 3000);
}

// ===== MODAL =====
function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModalFn(id) {
  document.getElementById(id).classList.remove("active");
  if (id === "modal-order") resetWizard();
}

// ===== DATA =====
async function loadAllData() {
  try {
    await Promise.all([loadOrders(), loadClients()]);
  } catch(e) {
    console.error("Error loading data:", e);
  }
  updateKPIs();
  renderRecentOrders();
  renderOrdersTable();
  renderClientsTable();
  populateClientSelect();
}

async function loadOrders() {
  try {
    var snap = await getDocs(query(collection(db, "reparaciones"), orderBy("fechaEntrada", "desc")));
    allOrders = [];
    snap.forEach(function(d) { allOrders.push(Object.assign({ id: d.id }, d.data())); });
  } catch(e) {
    console.error("Error orders:", e);
    try {
      var snap2 = await getDocs(collection(db, "reparaciones"));
      allOrders = [];
      snap2.forEach(function(d) { allOrders.push(Object.assign({ id: d.id }, d.data())); });
    } catch(e2) {
      console.error("Error orders fallback:", e2);
      allOrders = [];
    }
  }
}

async function loadClients() {
  try {
    var snap = await getDocs(collection(db, "clientes"));
    allClients = [];
    snap.forEach(function(d) { allClients.push(Object.assign({ id: d.id }, d.data())); });
  } catch(e) {
    console.error("Error clients:", e);
    allClients = [];
  }
}

// ===== HELPERS =====
function formatDate(val) {
  if (!val) return "\u2014";
  var d = val.toDate ? val.toDate() : new Date(val);
  var datePart = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Madrid" });
  var timePart = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
  return datePart + " " + timePart;
}

function statusBadge(estado) {
  var labels = {
    pendiente: "\u23F3 Pendiente",
    en_reparacion: "\uD83D\uDD27 En Reparaci\u00f3n",
    listo: "\u2705 Listo",
    entregado: "\uD83D\uDCE6 Entregado"
  };
  return '<span class="badge badge-' + estado + '">' + (labels[estado] || estado) + "</span>";
}

window.whatsappReady = async function(id) {
  var o = allOrders.find(function(x) { return x.id === id; });
  if (!o) return;
  var cl = allClients.find(function(c) { return c.id === o.clienteId; });
  if (!cl || !cl.telefono) { alert("No hay telefono para este cliente"); return; }
  var t = cl.telefono.replace(/\D/g, "");
  if (t.length === 9 && (t.startsWith("6") || t.startsWith("7"))) t = "34" + t;
  var msg = encodeURIComponent("Hola " + (cl.nombre || "") + ", ya esta listo tu patinete para que salga a rodar");
  window.open("https://wa.me/" + t + "?text=" + msg, "_blank");

  // AUTO-LISTO
  if (o.estado !== "listo" && o.estado !== "entregado") {
    try {
      await updateDoc(doc(db, "reparaciones", id), { estado: "listo" });
      showToast("Estado actualizado a LISTO \u2705");
      await loadAllData();
    } catch (e) {
      console.error("Error auto-listo:", e);
    }
  }
};

function truncStr(str, len) {
  if (!str) return "\u2014";
  if (!len) len = 30;
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ===== KPIs =====
function updateKPIs() {
  var counts = { pendiente: 0, en_reparacion: 0, listo: 0, entregado: 0 };
  var ingresosMes = 0;
  var now = new Date();

  allOrders.forEach(function(o) {
    if (counts[o.estado] !== undefined) counts[o.estado]++;
    if (o.estado === "entregado" && o.fechaSalida) {
      var fs = o.fechaSalida.toDate ? o.fechaSalida.toDate() : new Date(o.fechaSalida);
      if (fs.getMonth() === now.getMonth() && fs.getFullYear() === now.getFullYear()) {
        ingresosMes += parseFloat(o.costeTotal) || 0;
      }
    }
  });

  document.getElementById("kpi-pendientes").textContent = counts.pendiente;
  document.getElementById("kpi-reparacion").textContent = counts.en_reparacion;
  document.getElementById("kpi-listos").textContent = counts.listo;
  if (document.getElementById("kpi-ingresos")) {
    document.getElementById("kpi-ingresos").textContent = "\u20AC" + ingresosMes.toFixed(0);
  }
}

// ===== RENDER RECENT ORDERS =====
function renderRecentOrders() {
  var tbody = document.getElementById("recent-orders");
  var recent = allOrders.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No hay cotizaciones todav\u00eda</p></td></tr>';
    return;
  }
  var html = "";
  recent.forEach(function(o, i) {
    var marca = (o.patinete && o.patinete.marca) || "";
    var modelo = (o.patinete && o.patinete.modelo) || "";
    html += '<tr>';
    html += '<td style="color:var(--text-dim);">#' + String(i + 1).padStart(3, "0") + "</td>";
    html += "<td>" + (o.clienteNombre || "\u2014") + "</td>";
    html += "<td>" + marca + " " + modelo + "</td>";
    html += "<td>" + statusBadge(o.estado) + "</td>";
    html += '<td style="font-weight:700;color:var(--accent);">\u20AC' + parseFloat(o.costeTotal || 0).toFixed(2) + "</td>";
    html += '<td><div style="display:flex;gap:0.4rem;">';
    html += '<button class="btn btn-secondary btn-small" onclick="viewOrder(\'' + o.id + "')\">\uD83D\uDC41</button>";
    html += '<button class="btn btn-whatsapp btn-small" onclick="whatsappReady(\'' + o.id + "')\">\u2705 Listo</button>";
    html += "</div></td></tr>";
  });
  tbody.innerHTML = html;
}

// ===== RENDER ORDERS TABLE =====
function renderOrdersTable() {
  var tbody = document.getElementById("orders-table");
  var filtered = allOrders.slice();
  var searchEl = document.getElementById("search-orders");
  var searchTerm = searchEl ? searchEl.value.toLowerCase() : "";

  if (currentFilter !== "todos") {
    filtered = filtered.filter(function(o) { return o.estado === currentFilter; });
  }
  if (searchTerm) {
    filtered = filtered.filter(function(o) {
      var cn = (o.clienteNombre || "").toLowerCase();
      var pm = ((o.patinete && o.patinete.marca) || "").toLowerCase();
      var pmod = ((o.patinete && o.patinete.modelo) || "").toLowerCase();
      var cl = allClients.find(function(c) { return c.id === o.clienteId; });
      var ph = (cl ? cl.telefono : "").toLowerCase();
      return cn.indexOf(searchTerm) !== -1 || pm.indexOf(searchTerm) !== -1 || pmod.indexOf(searchTerm) !== -1 || ph.indexOf(searchTerm) !== -1;
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:3rem;">No se encontraron cotizaciones</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function(o) {
    var fallosCount = (o.fallos || []).length;
    var marca = (o.patinete && o.patinete.marca) || "";
    var modelo = (o.patinete && o.patinete.modelo) || "";
    html += "<tr>";
    html += '<td style="color:var(--text-dim);font-size:0.8rem;">' + o.id.slice(0, 6) + "</td>";
    html += '<td style="font-weight:600;">' + (o.clienteNombre || "\u2014") + "</td>";
    html += "<td>" + marca + " " + modelo + "</td>";
    html += "<td>" + fallosCount + " fallo" + (fallosCount !== 1 ? "s" : "") + "</td>";
    html += "<td>" + statusBadge(o.estado) + "</td>";
    html += '<td style="font-weight:700;">\u20AC' + parseFloat(o.costeTotal || 0).toFixed(2) + "</td>";
    html += "<td>";
    html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;justify-content:center;">';
    html += '<button class="btn btn-secondary btn-small" onclick="viewOrder(\'' + o.id + "')\" title=\"Ver\">\uD83D\uDC41</button>";
    html += '<button class="btn btn-secondary btn-small" onclick="editOrder(\'' + o.id + "')\" title=\"Editar\">\u270F\uFE0F</button>";
    html += '<button class="btn btn-secondary btn-small" onclick="generatePDF(\'' + o.id + "')\" title=\"Boletín Entrada\" style=\"background:rgba(56,189,248,0.1); border-color:var(--info);\">\uD83D\uDCC4</button>";
    html += '<button class="btn btn-secondary btn-small" onclick="generateInvoice(\'' + o.id + "')\" title=\"Factura\">\uD83E\uDDFE</button>";
    html += '<button class="btn btn-whatsapp btn-small" onclick="whatsappInquiry(\'' + o.id + "')\" title=\"Consultar\" style=\"background:#075e54;\">\uD83D\uDCAC</button>";
    html += '<button class="btn btn-whatsapp btn-small" onclick="whatsappReady(\'' + o.id + "')\" title=\"Avisar Listo\">\uD83D\uDFE2</button>";
    if(o.estado !== "entregado") {
      html += '<button class="btn btn-primary btn-small" onclick="marcarRecogida(\'' + o.id + "')\" title=\"Cobrar y Entregar\" style=\"background:var(--success); color:#000;\">\uD83D\uDCB0</button>";
    }
    html += '<button class="btn btn-danger btn-small" onclick="deleteOrder(\'' + o.id + "')\" title=\"Eliminar\">\uD83D\uDDD1</button>";
    html += "</div></td></tr>";
  });
  tbody.innerHTML = html;
}

// ===== RENDER CLIENTS =====
function renderClientsTable() {
  var tbody = document.getElementById("clients-table");
  var filtered = allClients.slice();
  var searchEl = document.getElementById("search-clients");
  var searchTerm = searchEl ? searchEl.value.toLowerCase() : "";

  if (searchTerm) {
    filtered = filtered.filter(function(c) {
      return (c.nombre || "").toLowerCase().indexOf(searchTerm) !== -1 ||
        (c.telefono || "").indexOf(searchTerm) !== -1;
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:3rem;">No hay clientes registrados</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function(c) {
    var reps = allOrders.filter(function(o) { return o.clienteId === c.id; }).length;
    html += "<tr>";
    html += '<td style="font-weight:600;">' + c.nombre + "</td>";
    html += "<td>" + (c.telefono || "\u2014") + "</td>";
    html += '<td><span class="badge badge-en_reparacion">' + reps + "</span></td>";
    html += "<td>";
    html += '<div style="display:flex;gap:0.4rem;">';
    html += '<button class="btn btn-secondary btn-small" onclick="editClient(\'' + c.id + "')\">\u270F\uFE0F</button>";
    html += '<button class="btn btn-danger btn-small" onclick="deleteClient(\'' + c.id + "')\">\uD83D\uDDD1</button>";
    html += "</div></td></tr>";
  });
  tbody.innerHTML = html;
}

// ===== CLIENT SELECT =====
function populateClientSelect() {
  var sel = document.getElementById("order-client-select");
  sel.innerHTML = '<option value="">-- Crear nuevo cliente --</option>';
  allClients.forEach(function(c) {
    var opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nombre + " (" + (c.telefono || c.dni || "") + ")";
    sel.appendChild(opt);
  });
}

// ===== WIZARD =====
function resetWizard() {
  currentWizardStep = 1;
  document.getElementById("order-form").reset();
  document.getElementById("order-id").value = "";
  document.getElementById("fallos-list").innerHTML = "";
  document.getElementById("piezas-list").innerHTML = "";
  document.getElementById("or-fecha-entrada").value = new Date().toISOString().split("T")[0];
  updateWizardUI();
}

function updateWizardUI() {
  document.querySelectorAll(".wizard-step").forEach(function(s) {
    var n = parseInt(s.dataset.step);
    s.classList.remove("active", "done");
    if (n === currentWizardStep) s.classList.add("active");
    else if (n < currentWizardStep) s.classList.add("done");
  });
  document.querySelectorAll(".wizard-panel").forEach(function(p) { p.classList.remove("active"); });
  document.getElementById("step-" + currentWizardStep).classList.add("active");

  document.getElementById("btn-prev-step").style.display = currentWizardStep > 1 ? "" : "none";
  document.getElementById("btn-next-step").style.display = currentWizardStep < 3 ? "" : "none";
  document.getElementById("btn-save-order").style.display = currentWizardStep === 3 ? "" : "none";
  var pdfBtn = document.getElementById("btn-save-pdf");
  if (pdfBtn) pdfBtn.style.display = currentWizardStep === 3 ? "" : "none";
}

// ===== VALIDATION =====
function validateStep(step) {
  clearValidation();
  var valid = true;

  if (step === 1) {
    var nombre = document.getElementById("oc-nombre");
    var tel = document.getElementById("oc-telefono");
    var email = document.getElementById("oc-email");
    var dni = document.getElementById("oc-dni");

    if (!nombre.value.trim()) { markInvalid(nombre); valid = false; }
    var telClean = tel.value.replace(/\s/g, "");
    if (!telClean || !/^(\+34|0034|34)?[6789]\d{8}$/.test(telClean)) { markInvalid(tel); valid = false; }
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { markInvalid(email); valid = false; }
    if (dni.value && !/^([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])$/.test(dni.value.trim())) { markInvalid(dni); valid = false; }
  }

  if (step === 2) {
    var marca = document.getElementById("op-marca");
    var modelo = document.getElementById("op-modelo");
    var serie = document.getElementById("op-serie");
    if (!marca.value.trim()) { markInvalid(marca); valid = false; }
    if (!modelo.value.trim()) { markInvalid(modelo); valid = false; }
    if (serie.value && serie.value.trim().length < 5) { markInvalid(serie); valid = false; }
  }

  if (step === 3) {
    var coste = document.getElementById("or-coste");
    var fEntrada = document.getElementById("or-fecha-entrada");
    var fSalida = document.getElementById("or-fecha-salida");
    if (!coste.value || parseFloat(coste.value) < 0) { markInvalid(coste); valid = false; }
    if (fEntrada.value && fSalida.value && new Date(fSalida.value) < new Date(fEntrada.value)) { markInvalid(fSalida); valid = false; }
    if (document.getElementById("fallos-list").children.length === 0) {
      showToast("Debes a\u00f1adir al menos un fallo", "error");
      valid = false;
    }
  }

  if (!valid) showToast("Corrige los campos marcados", "error");
  return valid;
}

function markInvalid(el) { el.classList.add("invalid"); }
function clearValidation() {
  document.querySelectorAll(".invalid").forEach(function(el) { el.classList.remove("invalid"); });
}

// ===== DYNAMIC LISTS =====
function addFalloFn() {
  falloCounter++;
  var el = document.getElementById("fallos-list");
  var div = document.createElement("div");
  div.className = "dynamic-item";
  div.innerHTML = '<button type="button" class="remove-item" onclick="this.parentElement.remove()">\u2715</button>' +
    '<div class="form-row">' +
    '<div class="form-group" style="margin-bottom:0;flex:2;"><label>Descripci\u00f3n del Fallo</label>' +
    '<input type="text" class="fallo-desc" placeholder="ej: Pinchazo, holgura..." style="width:100%;"></div>' +
    '<div class="form-group" style="margin-bottom:0;flex:1;"><label>Prioridad</label>' +
    '<select class="fallo-gravedad">' +
    '<option value="normal">\u26AA Normal</option>' +
    '<option value="alta">\uD83D\uDFE0 Alta</option>' +
    '<option value="urgente">\uD83D\uDD34 Servicio de Urgencia</option></select></div></div>';
  el.appendChild(div);
}

function addPiezaFn() {
  piezaCounter++;
  var el = document.getElementById("piezas-list");
  var div = document.createElement("div");
  div.className = "dynamic-item";
  div.innerHTML = '<button type="button" class="remove-item" onclick="this.parentElement.remove()">\u2715</button>' +
    '<div class="form-row">' +
    '<div class="form-group" style="margin-bottom:0;"><label>Nombre pieza</label>' +
    '<input type="text" class="pieza-nombre" placeholder="Bater\u00eda 10Ah, freno disco..."></div>' +
    '<div class="form-group" style="margin-bottom:0;"><label>Precio (\u20AC)</label>' +
    '<input type="number" class="pieza-precio" step="0.01" min="0" placeholder="0.00"></div></div>' +
    '<div class="form-group" style="margin-top:0.8rem;margin-bottom:0;">' +
    '<label>Cantidad</label><input type="number" class="pieza-cantidad" value="1" min="1"></div>';
  el.appendChild(div);
}

function collectFallos() {
  var items = [];
  document.querySelectorAll("#fallos-list .dynamic-item").forEach(function(d) {
    items.push({
      gravedad: d.querySelector(".fallo-gravedad").value,
      descripcion: d.querySelector(".fallo-desc").value
    });
  });
  return items;
}

function collectPiezas() {
  var items = [];
  document.querySelectorAll("#piezas-list .dynamic-item").forEach(function(d) {
    items.push({
      nombre: d.querySelector(".pieza-nombre").value,
      precio: parseFloat(d.querySelector(".pieza-precio").value) || 0,
      cantidad: parseInt(d.querySelector(".pieza-cantidad").value) || 1
    });
  });
  return items;
}

// ===== SAVE ORDER =====
async function saveOrderFn() {
  if (!validateStep(3)) return null;

  var clienteId = document.getElementById("order-client-select").value;
  var clienteNombre = document.getElementById("oc-nombre").value.trim();

  var finalClienteId = clienteId;
  var clienteTel = document.getElementById("oc-telefono").value.trim();

  if (!clienteId) {
    try {
      var clientData = {
        nombre: clienteNombre,
        telefono: clienteTel
      };
      var ref = await addDoc(collection(db, "clientes"), clientData);
      finalClienteId = ref.id;
    } catch(e) {
      showToast("Error al guardar cliente: " + e.message, "error");
      return null;
    }
  } else {
    // Actualizar cliente maestro
    try {
      await updateDoc(doc(db, "clientes", clienteId), {
        nombre: clienteNombre,
        telefono: clienteTel
      });
    } catch(e) { console.error("Error updating master client:", e); }
  }

  var feVal = document.getElementById("or-fecha-entrada").value;
  var fsVal = document.getElementById("or-fecha-salida").value;

  var orderData = {
    clienteId: finalClienteId,
    clienteNombre: clienteNombre,
    patinete: {
      marca: document.getElementById("op-marca").value.trim(),
      modelo: document.getElementById("op-modelo").value.trim()
    },
    fallos: collectFallos(),
    piezasUsadas: collectPiezas(),
    costeTotal: parseFloat(document.getElementById("or-coste").value) || 0,
    estado: document.getElementById("or-estado").value,
    fechaEntrada: feVal ? Timestamp.fromDate(new Date(feVal)) : Timestamp.now(),
    fechaSalida: fsVal ? Timestamp.fromDate(new Date(fsVal)) : null,
    garantia: document.getElementById("or-garantia").value.trim(),
    notas: document.getElementById("or-notas").value.trim(),
    lastUpdated: Timestamp.now()
  };

  try {
    var existingId = document.getElementById("order-id").value;
    var savedId = existingId;
    if (existingId) {
      await updateDoc(doc(db, "reparaciones", existingId), orderData);
      showToast("Cotizaci\u00f3n actualizada correctamente");
    } else {
      var newRef = await addDoc(collection(db, "reparaciones"), orderData);
      savedId = newRef.id;
      showToast("Cotizaci\u00f3n creada correctamente");
    }
    closeModalFn("modal-order");
    await loadAllData();
    return savedId;
  } catch(e) {
    showToast("Error: " + e.message, "error");
    return null;
  }
}

// ===== PDF GENERATION =====
function generatePDFFn(id) {
  var o = allOrders.find(function(x) { return x.id === id; });
  if (!o) { showToast("Cotizaci\u00f3n no encontrada", "error"); return; }
  var cl = allClients.find(function(c) { return c.id === o.clienteId; });

  var jsPDF = window.jspdf.jsPDF;
  var pdf = new jsPDF();

  var accent = [56, 189, 248];
  var dark = [15, 23, 42];
  var gray = [148, 163, 184];
  var white = [255, 255, 255];
  var black = [0, 0, 0];
  var lightBg = [245, 247, 250];

  // HEADER
  pdf.setFillColor(dark[0], dark[1], dark[2]);
  pdf.rect(0, 0, 210, 48, "F");
  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.rect(0, 45, 210, 3, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ANACLETO", 15, 22);

  pdf.setFontSize(9);
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text("VICENTE LARA SOLER - NIF: 48412185Z", 15, 30);

  pdf.setFontSize(7);
  pdf.setTextColor(gray[0], gray[1], gray[2]);
  pdf.text("Avenida cortes valencianas, n11 bajo", 15, 38);
  pdf.text("46980 Paterna (Valencia) - info@anacleto.com", 15, 42);

  // COTIZACION badge
  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.roundedRect(130, 10, 65, 14, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text("COTIZACION", 144, 19);

  pdf.setFontSize(8);
  pdf.setTextColor(gray[0], gray[1], gray[2]);
  pdf.text("No: " + o.id.slice(0, 10).toUpperCase(), 135, 32);
  pdf.text("Fecha: " + formatDate(o.fechaEntrada), 135, 38);
  var stLabels = { pendiente: "PENDIENTE", en_reparacion: "EN REPARACION", listo: "LISTO", entregado: "ENTREGADO" };
  pdf.text("Estado: " + (stLabels[o.estado] || o.estado), 135, 42);

  var y = 58;

  // CLIENT BOX
  pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  pdf.roundedRect(15, y, 87, 45, 3, 3, "F");
  pdf.setDrawColor(220, 225, 230);
  pdf.roundedRect(15, y, 87, 45, 3, 3, "S");

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text("DATOS DEL CLIENTE", 20, y + 8);

  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  pdf.text(truncStr(o.clienteNombre || "---", 28), 20, y + 17);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);
  if (cl && cl.telefono) pdf.text("Tel: " + cl.telefono, 20, y + 24);
  if (cl && cl.email) pdf.text("Email: " + cl.email, 20, y + 30);
  pdf.text("DNI/NIE: " + (cl && cl.dni ? cl.dni : "---"), 20, y + 36);
  if (cl && cl.direccion) pdf.text("Dir: " + truncStr(cl.direccion, 30), 20, y + 42);

  // SCOOTER BOX
  pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  pdf.roundedRect(108, y, 87, 45, 3, 3, "F");
  pdf.setDrawColor(220, 225, 230);
  pdf.roundedRect(108, y, 87, 45, 3, 3, "S");

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text("DATOS DEL PATINETE", 113, y + 8);

  var pMarca = (o.patinete && o.patinete.marca) || "";
  var pModelo = (o.patinete && o.patinete.modelo) || "";
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  pdf.text(pMarca + " " + pModelo, 113, y + 17);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);
  pdf.text("No Serie: " + ((o.patinete && o.patinete.serie) || "---"), 113, y + 24);
  pdf.text("Color: " + ((o.patinete && o.patinete.color) || "---"), 113, y + 30);
  pdf.text("Ano: " + ((o.patinete && o.patinete.anio) || "---"), 113, y + 36);
  if (o.patinete && o.patinete.km) pdf.text("Km: " + o.patinete.km, 113, y + 42);

  y += 55;

  // FALLOS TABLE
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text("DIAGNOSTICO DE FALLOS", 15, y);
  y += 3;

  var fallosData = (o.fallos || []).map(function(f, i) {
    return [(i + 1).toString(), f.tipo, f.descripcion || "Sin descripcion", f.gravedad.toUpperCase()];
  });

  if (fallosData.length > 0) {
    pdf.autoTable({
      startY: y,
      head: [["#", "Componente", "Descripcion del Fallo", "Gravedad"]],
      body: fallosData,
      margin: { left: 15, right: 15 },
      theme: "grid",
      headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 7.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50], cellPadding: 3.5 },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: { 0: { cellWidth: 10, halign: "center" }, 3: { cellWidth: 25, halign: "center" } }
    });
    y = pdf.lastAutoTable.finalY + 8;
  }

  // COSTES TABLE
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text("DESGLOSE DE COSTES", 15, y);
  y += 3;

  var costRows = [];
  (o.piezasUsadas || []).forEach(function(p) {
    costRows.push([
      "Pieza: " + p.nombre,
      p.cantidad.toString(),
      "\u20AC" + p.precio.toFixed(2),
      "\u20AC" + (p.precio * p.cantidad).toFixed(2)
    ]);
  });

  var piezasTotal = (o.piezasUsadas || []).reduce(function(sum, p) { return sum + (p.precio * p.cantidad); }, 0);
  var laborCost = (parseFloat(o.costeTotal) || 0) - piezasTotal;
  if (laborCost > 0) {
    costRows.push(["Mano de obra / Diagnostico", "1", "\u20AC" + laborCost.toFixed(2), "\u20AC" + laborCost.toFixed(2)]);
  }

  if (costRows.length === 0) {
    costRows.push(["Servicio de reparacion completo", "1", "\u20AC" + (o.costeTotal || 0).toFixed(2), "\u20AC" + (o.costeTotal || 0).toFixed(2)]);
  }

  pdf.autoTable({
    startY: y,
    head: [["Concepto", "Cant.", "Precio Ud.", "Subtotal"]],
    body: costRows,
    margin: { left: 15, right: 15 },
    theme: "grid",
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 7.5, cellPadding: 4 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50], cellPadding: 3.5 },
    alternateRowStyles: { fillColor: lightBg },
    columnStyles: { 1: { cellWidth: 15, halign: "center" }, 2: { cellWidth: 25, halign: "right" }, 3: { cellWidth: 25, halign: "right" } }
  });
  y = pdf.lastAutoTable.finalY + 2;

  // TOTAL BOX with IVA
  var totalSinIVA = parseFloat(o.costeTotal || 0);
  var iva = totalSinIVA * 0.21;
  var totalConIVA = totalSinIVA + iva;

  pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  pdf.roundedRect(120, y, 75, 32, 3, 3, "F");
  pdf.setDrawColor(220, 225, 230);
  pdf.roundedRect(120, y, 75, 32, 3, 3, "S");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Base imponible:", 125, y + 8);
  pdf.text("\u20AC" + totalSinIVA.toFixed(2), 180, y + 8, { align: "right" });
  pdf.text("IVA (21%):", 125, y + 15);
  pdf.text("\u20AC" + iva.toFixed(2), 180, y + 15, { align: "right" });

  pdf.setDrawColor(accent[0], accent[1], accent[2]);
  pdf.line(125, y + 19, 190, y + 19);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(dark[0], dark[1], dark[2]);
  pdf.text("TOTAL:", 125, y + 28);
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text("\u20AC" + totalConIVA.toFixed(2), 190, y + 28, { align: "right" });

  y += 42;

  // ADDITIONAL INFO
  if (o.garantia || o.notas || o.fechaSalida) {
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(accent[0], accent[1], accent[2]);
    pdf.text("INFORMACION ADICIONAL", 15, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    if (o.garantia) { pdf.text("Garantia: " + o.garantia, 15, y); y += 5; }
    if (o.fechaSalida) { pdf.text("Fecha estimada de entrega: " + formatDate(o.fechaSalida), 15, y); y += 5; }
    if (o.notas) { pdf.text("Observaciones: " + o.notas, 15, y); y += 5; }
    y += 5;
  }

  // SIGNATURES
  y = Math.max(y + 10, 235);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(15, y, 90, y);
  pdf.line(120, y, 195, y);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(150, 150, 150);
  pdf.text("Firma del Cliente", 38, y + 6);
  pdf.text("Firma del Tecnico / Sello", 140, y + 6);
  pdf.text("DNI: " + ((cl && cl.dni) ? cl.dni : "________________"), 32, y + 12);
  pdf.text("Fecha: ____/____/________", 135, y + 12);

  // FOOTER
  pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  pdf.rect(0, 275, 210, 22, "F");
  pdf.setDrawColor(accent[0], accent[1], accent[2]);
  pdf.line(0, 275, 210, 275);

  pdf.setFontSize(6);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(130, 130, 130);
  pdf.text("Esta cotizacion tiene una validez de 30 dias a partir de la fecha de emision.", 15, 281);
  pdf.text("Las reparaciones incluyen la garantia indicada. Piezas sustituidas quedan en propiedad del taller salvo acuerdo previo.", 15, 285);
  pdf.text("Documento generado por Anacleto Taller - " + new Date().getFullYear() + " - " + new Date().toLocaleString("es-ES"), 15, 289);

  pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(dark[0], dark[1], dark[2]);
  pdf.text("METODO PAGO: " + (o.metodoPago || "EFECTIVO").toUpperCase(), 15, y + 5);

  // CONDICIONES DEL SERVICIO - Posicionadas debajo para evitar solapamiento
  var ny = y + 45;
  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.roundedRect(15, ny, 22, 4, 1, 1, "F");
  pdf.setFontSize(6); pdf.setTextColor(255, 255, 255);
  pdf.text("IMPORTANTE", 17, ny + 3);

  pdf.setFontSize(7); pdf.setTextColor(dark[0], dark[1], dark[2]); pdf.setFont("helvetica", "bold");
  pdf.text("CONDICIONES DEL SERVICIO:", 40, ny + 3);

  pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.5); pdf.setTextColor(80, 80, 80);
  var condText = "Una vez que el patinete haya sido reparado o se haya elaborado el presupuesto y comunicado al cliente, este dispondrá de un plazo de 2 días para proceder a su recogida. Transcurrido dicho plazo sin haber sido retirado, se aplicará un cargo de 5 € por día en concepto de almacenamiento o estancia.";
  var splitCond = pdf.splitTextToSize(condText, 180);
  pdf.text(splitCond, 15, ny + 8);

  pdf.save("Cotizacion_" + o.id.slice(0, 8) + "_" + (o.clienteNombre || "Cliente").replace(/\s/g, '_') + ".pdf");
  showToast("Cotizacion PDF generada y descargada");
}

// ===== VIEW ORDER DETAIL =====
function viewOrderFn(id) {
  var o = allOrders.find(function(x) { return x.id === id; });
  if (!o) return;
  var cl = allClients.find(function(c) { return c.id === o.clienteId; });

  var pMarca = (o.patinete && o.patinete.marca) || "";
  var pModelo = (o.patinete && o.patinete.modelo) || "";
  var pSerie = (o.patinete && o.patinete.serie) || "---";
  var pColor = (o.patinete && o.patinete.color) || "";
  var pAnio = (o.patinete && o.patinete.anio) || "";

  var html = '<div style="display:grid;gap:1.5rem;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
  html += '<div><div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Cotizacion</div>';
  html += '<div style="font-family:Orbitron;font-size:1.1rem;">#' + o.id.slice(0, 8) + '</div></div>';
  html += statusBadge(o.estado) + '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">';
  html += '<div style="background:rgba(0,0,0,0.2);padding:1rem;border-radius:8px;border:1px solid var(--border);">';
  html += '<div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.5rem;">Cliente</div>';
  html += '<div style="font-weight:700;">' + (o.clienteNombre || "---") + '</div>';
  html += '<div style="font-size:0.85rem;color:var(--text-dim);">' + ((cl && cl.telefono) || "") + '</div>';
  html += '<div style="font-size:0.85rem;color:var(--text-dim);">' + ((cl && cl.dni) || "") + '</div></div>';

  html += '<div style="background:rgba(0,0,0,0.2);padding:1rem;border-radius:8px;border:1px solid var(--border);">';
  html += '<div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.5rem;">Patinete</div>';
  html += '<div style="font-weight:700;">' + pMarca + " " + pModelo + '</div>';
  html += '<div style="font-size:0.85rem;color:var(--text-dim);">S/N: ' + pSerie + '</div>';
  html += '<div style="font-size:0.85rem;color:var(--text-dim);">' + pColor + " " + pAnio + '</div></div></div>';

  html += '<div><div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.5rem;">Fallos Diagnosticados</div>';
  var fallos = o.fallos || [];
  if (fallos.length > 0) {
    fallos.forEach(function(f) {
      var labels={normal:"Normal",alta:"Alta",urgente:"Urgente"};
      html += '<div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.4rem;">';
      html += '<span class="badge badge-' + f.gravedad + '">' + (labels[f.gravedad]||f.gravedad) + '</span>';
      html += '<span style="font-size:0.85rem;">' + (f.descripcion || "") + '</span></div>';
    });
  } else {
    html += '<div style="color:var(--text-dim);">Sin fallos registrados</div>';
  }
  html += '</div>';

  var piezas = o.piezasUsadas || [];
  if (piezas.length > 0) {
    html += '<div><div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.5rem;">Piezas</div>';
    piezas.forEach(function(p) {
      html += '<div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.85rem;">';
      html += '<span>' + p.cantidad + 'x ' + p.nombre + '</span>';
      html += '<span style="color:var(--accent);">\u20AC' + (p.precio * p.cantidad).toFixed(2) + '</span></div>';
    });
    html += '</div>';
  }

  html += '<div style="display:flex;justify-content:space-between;padding-top:1rem;border-top:1px solid var(--border);">';
  html += '<div><span style="color:var(--text-dim);">Entrada:</span> ' + formatDate(o.fechaEntrada);
  html += '<br><span style="color:var(--text-dim);">Salida:</span> ' + formatDate(o.fechaSalida) + '</div>';
  html += '<div style="text-align:right;"><div style="font-size:0.75rem;color:var(--text-dim);">TOTAL</div>';
  html += '<div style="font-family:Orbitron;font-size:1.5rem;color:var(--accent);">\u20AC' + parseFloat(o.costeTotal || 0).toFixed(2) + '</div></div></div>';

  if (o.garantia) html += '<div style="font-size:0.8rem;color:var(--text-dim);">Garantia: ' + o.garantia + '</div>';
  if (o.notas) html += '<div style="font-size:0.8rem;color:var(--text-dim);">Notas: ' + o.notas + '</div>';
  html += '</div>';

  document.getElementById("detail-body").innerHTML = html;
  document.getElementById("btn-detail-pdf").onclick = function() { generatePDFFn(id); };
  openModal("modal-detail");
}

// ===== EDIT ORDER =====
function editOrderFn(id) {
  var o = allOrders.find(function(x) { return x.id === id; });
  if (!o) return;

  resetWizard();
  document.getElementById("order-modal-title").textContent = "Editar Cotizacion";
  document.getElementById("order-id").value = id;

  if (o.clienteId) document.getElementById("order-client-select").value = o.clienteId;
  document.getElementById("oc-nombre").value = o.clienteNombre || "";
  var cl = allClients.find(function(c) { return c.id === o.clienteId; });
  if (cl) {
    document.getElementById("oc-telefono").value = cl.telefono || "";
  }

  document.getElementById("op-marca").value = (o.patinete && o.patinete.marca) || "";
  document.getElementById("op-modelo").value = (o.patinete && o.patinete.modelo) || "";

  (o.fallos || []).forEach(function(f) {
    addFalloFn();
    var last = document.querySelector("#fallos-list .dynamic-item:last-child");
    if(last.querySelector(".fallo-gravedad")) last.querySelector(".fallo-gravedad").value = f.gravedad;
    if(last.querySelector(".fallo-desc")) last.querySelector(".fallo-desc").value = f.descripcion || "";
  });

  (o.piezasUsadas || []).forEach(function(p) {
    addPiezaFn();
    var last = document.querySelector("#piezas-list .dynamic-item:last-child");
    last.querySelector(".pieza-nombre").value = p.nombre;
    last.querySelector(".pieza-precio").value = p.precio;
    last.querySelector(".pieza-cantidad").value = p.cantidad;
  });

  document.getElementById("or-estado").value = o.estado || "pendiente";
  document.getElementById("or-coste").value = o.costeTotal || "";
  document.getElementById("or-garantia").value = o.garantia || "";
  document.getElementById("or-notas").value = o.notas || "";

  if (o.fechaEntrada) {
    var d1 = o.fechaEntrada.toDate ? o.fechaEntrada.toDate() : new Date(o.fechaEntrada);
    document.getElementById("or-fecha-entrada").value = d1.toISOString().split("T")[0];
  }
  if (o.fechaSalida) {
    var d2 = o.fechaSalida.toDate ? o.fechaSalida.toDate() : new Date(o.fechaSalida);
    document.getElementById("or-fecha-salida").value = d2.toISOString().split("T")[0];
  }

  openModal("modal-order");
}

// ===== CLIENT CRUD =====
function openClientFormFn() {
  document.getElementById("client-form").reset();
  document.getElementById("client-id").value = "";
  document.getElementById("client-modal-title").textContent = "Nuevo Cliente";
  openModal("modal-client");
}

function editClientFn(id) {
  var c = allClients.find(function(x) { return x.id === id; });
  if (!c) return;
  document.getElementById("client-id").value = id;
  document.getElementById("client-modal-title").textContent = "Editar Cliente";
  document.getElementById("cf-nombre").value = c.nombre || "";
  document.getElementById("cf-telefono").value = c.telefono || "";
  openModal("modal-client");
}

async function saveClientFn() {
  var nombre = document.getElementById("cf-nombre");
  var tel = document.getElementById("cf-telefono");
  clearValidation();

  if (!nombre.value.trim()) { markInvalid(nombre); showToast("Nombre obligatorio", "error"); return; }
  if (!tel.value.trim()) { markInvalid(tel); showToast("Telefono obligatorio", "error"); return; }

  var data = {
    nombre: nombre.value.trim(),
    telefono: tel.value.trim()
  };

  try {
    var id = document.getElementById("client-id").value;
    if (id) {
      await updateDoc(doc(db, "clientes", id), data);
      showToast("Cliente actualizado");
    } else {
      await addDoc(collection(db, "clientes"), data);
      showToast("Cliente creado");
    }
    closeModalFn("modal-client");
    await loadAllData();
  } catch(e) {
    showToast("Error: " + e.message, "error");
  }
}

async function deleteClientFn(id) {
  if (!confirm("Eliminar este cliente?")) return;
  try {
    await deleteDoc(doc(db, "clientes", id));
    showToast("Cliente eliminado");
    await loadAllData();
  } catch(e) {
    showToast("Error: " + e.message, "error");
  }
}

async function deleteOrderFn(id) {
  if (!confirm("Eliminar esta cotizacion?")) return;
  try {
    await deleteDoc(doc(db, "reparaciones", id));
    showToast("Cotizacion eliminada");
    await loadAllData();
  } catch(e) {
    showToast("Error: " + e.message, "error");
  }
}

// ========================================
// EXPOSE ALL FUNCTIONS TO WINDOW (GLOBAL)
// ========================================
window.navigate = function(viewId) {
  document.querySelectorAll(".view").forEach(function(v) { v.classList.remove("active"); });
  document.querySelectorAll(".nav-item[data-view]").forEach(function(n) { n.classList.remove("active"); });
  document.getElementById("view-" + viewId).classList.add("active");
  var navItem = document.querySelector('.nav-item[data-view="' + viewId + '"]');
  if (navItem) navItem.classList.add("active");
  var sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.classList.remove("open");
};

window.doLogout = async function() {
  await signOut(auth);
  window.location.href = "login.html";
};

window.closeModal = closeModalFn;
window.openOrderForm = function() {
  resetWizard();
  document.getElementById("order-modal-title").textContent = "Nueva Cotizacion de Reparacion";
  addFalloFn();
  openModal("modal-order");
};

window.openClientForm = openClientFormFn;
window.saveOrder = saveOrderFn;
window.saveClient = saveClientFn;
window.editOrder = editOrderFn;
window.editClient = editClientFn;
window.deleteOrder = deleteOrderFn;
window.deleteClient = deleteClientFn;
window.viewOrder = viewOrderFn;
window.generatePDF = generatePDFFn;
window.addFallo = addFalloFn;
window.addPieza = addPiezaFn;
window.filterOrders = renderOrdersTable;
window.filterClients = renderClientsTable;

window.saveAndGeneratePDF = async function() {
  var savedId = await saveOrderFn();
  if (savedId) {
    setTimeout(function() { generatePDFFn(savedId); }, 600);
  }
};

window.wizardNext = function() {
  if (!validateStep(currentWizardStep)) return;
  if (currentWizardStep < 3) { currentWizardStep++; updateWizardUI(); }
};

window.wizardPrev = function() {
  if (currentWizardStep > 1) { currentWizardStep--; updateWizardUI(); }
};

window.setFilter = function(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  renderOrdersTable();
};

window.onClientSelect = function() {
  var sel = document.getElementById("order-client-select");
  if (sel.value) {
    var c = allClients.find(function(cl) { return cl.id === sel.value; });
    if (c) {
      document.getElementById("oc-nombre").value = c.nombre || "";
      document.getElementById("oc-telefono").value = c.telefono || "";
    }
  } else {
    ["oc-nombre","oc-telefono"].forEach(function(id) {
      document.getElementById(id).value = "";
    });
  }
};

console.log("Anacleto Panel v3 loaded OK");
