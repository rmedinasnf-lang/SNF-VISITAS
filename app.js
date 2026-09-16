"use strict";

const templates = {
  dafPolimero: {
    title: "DAF · Polímero",
    fields: [
      ["Equipo", ""], ["Producto", ""], ["Caudal", "m³/h"],
      ["Dosis polímero", "ppm"], ["Concentración polímero", "g/L"],
      ["SST afluente", "mg/L"], ["Ratio", "kg polímero/t SST"],
      ["Carga másica", "kg/h"], ["SST efluente", "mg/L"],
      ["Remoción de SST", "%"]
    ],
    ops: [
      ["Presión bomba presurización", "bar"],
      ["Presión de saturación", "bar"],
      ["Flujo de aire", "L/min"]
    ]
  },
  dafCoagulante: {
    title: "DAF · Coagulante",
    fields: [
      ["Equipo", ""], ["Producto", ""], ["Caudal", "m³/h"],
      ["Dosis coagulante", "ppm"], ["SST afluente", "mg/L"],
      ["Carga másica", "kg/h"], ["SST efluente", "mg/L"],
      ["Remoción de SST", "%"]
    ],
    ops: [
      ["Presión bomba presurización", "bar"],
      ["Presión de saturación", "bar"],
      ["Flujo de aire", "L/min"]
    ]
  },
  decanter: {
    title: "Decanter",
    fields: [
      ["Equipo", ""], ["Producto", ""], ["Caudal", "m³/h"],
      ["Dosis polímero", "ppm"], ["Concentración polímero", "g/L"],
      ["SST afluente", "mg/L"], ["Ratio", "kg polímero/t SST"],
      ["Carga másica", "kg/h"], ["SST clarificado", "mg/L"],
      ["Remoción de SST", "%"]
    ],
    ops: [
      ["Velocidad diferencial", "rpm"], ["Torque", "%"],
      ["Punto de inyección", ""], ["Humedad", "%"]
    ]
  }
};

function makeEquipment(type) {
  const source = templates[type];
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    fields: source.fields.map(([name, unit]) => ({ name, unit, value: "" })),
    ops: source.ops.map(([name, unit]) => ({ name, unit, value: "" }))
  };
}

const emptyVisit = () => ({
  cliente: "",
  planta: "",
  fecha: new Date().toISOString().slice(0, 10),
  ingeniero: "Rodrigo Medina",
  participantes: "",
  objetivo: "",
  descripcion: "",
  observaciones: "",
  recomendaciones: "",
  emailCliente: "",
  copia: "",
  asunto: "Informe de visita técnica SNF"
});

function initialState() {
  return {
    visit: emptyVisit(),
    equipment: [
      makeEquipment("dafPolimero"),
      makeEquipment("decanter"),
      makeEquipment("dafCoagulante")
    ],
    photos: []
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("snfVisit") || "null");
    if (!saved || !saved.visit || !Array.isArray(saved.equipment)) return initialState();
    return { ...initialState(), ...saved, photos: Array.isArray(saved.photos) ? saved.photos : [] };
  } catch (error) {
    console.warn("No se pudo leer la visita guardada.", error);
    return initialState();
  }
}

let state = loadState();
let current = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function saveState(showMessage = false) {
  try {
    localStorage.setItem("snfVisit", JSON.stringify(state));
    if (showMessage) notify("Visita guardada en este dispositivo");
  } catch (error) {
    console.warn("No se pudo guardar todo el contenido.", error);
    notify("No fue posible guardar. Reduce el número o tamaño de las fotos.");
  }
  updateStats();
}

function visitField(key, label, type = "input", wide = false) {
  const value = escapeHtml(state.visit[key]);
  const control = type === "textarea"
    ? `<textarea data-visit-field="${key}">${value}</textarea>`
    : `<input type="${type}" data-visit-field="${key}" value="${value}">`;
  return `<div class="field${wide ? " wide" : ""}"><label>${label}</label>${control}</div>`;
}

function render() {
  const tabs = document.querySelector("#tabs");
  const pages = document.querySelector("#pages");
  if (!tabs || !pages) return;

  tabs.innerHTML = ["Visita", "Equipos", "Informe", "Correo"]
    .map((label, index) => `<button class="${index === current ? "active" : ""}" data-tab="${index}">${index + 1}. ${label}</button>`)
    .join("");

  if (current === 0) pages.innerHTML = renderVisitPage();
  if (current === 1) pages.innerHTML = renderEquipmentPage();
  if (current === 2) pages.innerHTML = renderReportPage();
  if (current === 3) pages.innerHTML = renderEmailPage();

  bindEvents();
  updateStats();
}

function renderVisitPage() {
  return `
    <section class="panel">
      <h2>Datos generales</h2>
      <div class="grid2">
        ${visitField("cliente", "Cliente")}
        ${visitField("planta", "Planta / ubicación")}
        ${visitField("fecha", "Fecha", "date")}
        ${visitField("ingeniero", "Ingeniero")}
        ${visitField("participantes", "Participantes", "input", true)}
        ${visitField("objetivo", "Objetivo de la visita", "textarea", true)}
        ${visitField("descripcion", "Descripción del trabajo realizado", "textarea", true)}
      </div>
    </section>

    <section class="panel">
      <h2>Registro fotográfico</h2>
      <p class="muted">Puedes tomar fotografías con la cámara o seleccionar imágenes del teléfono. Las fotos aparecerán en el informe.</p>
      <div class="toolbar">
        <label class="btn primary" for="photoInput">Añadir fotografías</label>
        <input id="photoInput" type="file" accept="image/*" capture="environment" multiple class="hidden">
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:14px">
        ${state.photos.length ? state.photos.map(renderPhotoCard).join("") : '<p class="muted">Aún no hay fotografías.</p>'}
      </div>
    </section>

    <div class="actions"><button class="btn primary" data-next>Continuar</button></div>`;
}

function renderPhotoCard(photo, index) {
  return `
    <div style="border:1px solid var(--line);border-radius:12px;overflow:hidden;background:white">
      <img src="${photo.dataUrl}" alt="Fotografía ${index + 1}" style="width:100%;height:130px;object-fit:cover;display:block">
      <div style="padding:8px">
        <input data-photo-caption="${photo.id}" value="${escapeHtml(photo.caption)}" placeholder="Descripción de la foto">
        <button class="btn" data-delete-photo="${photo.id}" style="width:100%;margin-top:6px">Eliminar</button>
      </div>
    </div>`;
}

function renderEquipmentPage() {
  return `
    <section class="panel toolbar">
      <b>Agregar tabla:</b>
      <button class="btn" data-add-equipment="dafPolimero">+ DAF polímero</button>
      <button class="btn" data-add-equipment="dafCoagulante">+ DAF coagulante</button>
      <button class="btn" data-add-equipment="decanter">+ Decanter</button>
    </section>
    ${state.equipment.map((equipment, index) => renderEquipmentCard(equipment, index)).join("")}
    <div class="actions"><button class="btn primary" data-next>Generar informe</button></div>`;
}

function renderEquipmentCard(equipment, index) {
  const rows = group => equipment[group].map((field, fieldIndex) => `
    <div class="erow">
      <span>${escapeHtml(field.name)}</span>
      <span>${escapeHtml(field.unit)}</span>
      <input data-equipment-id="${equipment.id}" data-group="${group}" data-index="${fieldIndex}" value="${escapeHtml(field.value)}">
    </div>`).join("");

  return `
    <section class="equipment">
      <div class="eqhead">
        <b>Equipo ${index + 1}: ${templates[equipment.type].title}</b>
        <button class="btn" data-delete-equipment="${equipment.id}">Eliminar</button>
      </div>
      ${rows("fields")}
      <div class="subtitle">Datos operacionales</div>
      ${rows("ops")}
    </section>`;
}

function renderReportPage() {
  return `
    <section class="panel">
      <h2>Conclusiones de la visita</h2>
      ${visitField("observaciones", "Observaciones de terreno", "textarea")}
      ${visitField("recomendaciones", "Recomendaciones al cliente", "textarea")}
    </section>
    ${renderReport()}
    <div class="actions">
      <button class="btn" data-save>Guardar visita</button>
      <button class="btn" data-print>Guardar como PDF</button>
      <button class="btn primary" data-next>Preparar correo</button>
    </div>`;
}

function renderReport() {
  const equipmentTables = state.equipment.map((equipment, index) => `
    <h3>Tabla ${index + 1}. ${templates[equipment.type].title}</h3>
    <table>
      <thead><tr><th>Parámetro</th><th>Unidad</th><th>Valor</th></tr></thead>
      <tbody>
        ${[...equipment.fields, ...equipment.ops].map(field => `
          <tr><td>${escapeHtml(field.name)}</td><td>${escapeHtml(field.unit)}</td><td>${escapeHtml(field.value) || "-"}</td></tr>`).join("")}
      </tbody>
    </table>`).join("");

  const photoGallery = state.photos.length ? `
    <h3>Registro fotográfico</h3>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
      ${state.photos.map((photo, index) => `
        <figure style="margin:0;break-inside:avoid">
          <img src="${photo.dataUrl}" alt="Fotografía ${index + 1}" style="width:100%;max-height:280px;object-fit:contain;border:1px solid #dbe4ea;border-radius:8px">
          <figcaption style="font-size:12px;margin-top:4px">Imagen ${index + 1}. ${escapeHtml(photo.caption) || "Registro de la visita"}</figcaption>
        </figure>`).join("")}
    </div>` : "";

  return `
    <section class="panel">
      <div class="report" id="report">
        <b>SNF WATER SCIENCE</b>
        <h2>Informe de visita técnico-comercial</h2>
        <p>${escapeHtml(state.visit.fecha)} · ${escapeHtml(state.visit.planta || "Planta")}</p>
        <h3>Cliente</h3><p>${escapeHtml(state.visit.cliente) || "Sin completar"}</p>
        <h3>Ingeniero</h3><p>${escapeHtml(state.visit.ingeniero) || "Sin completar"}</p>
        <h3>Participantes</h3><p>${escapeHtml(state.visit.participantes) || "Sin completar"}</p>
        <h3>Objetivo</h3><p>${escapeHtml(state.visit.objetivo) || "Sin completar"}</p>
        <h3>Descripción</h3><p>${escapeHtml(state.visit.descripcion) || "Sin completar"}</p>
        ${equipmentTables}
        ${photoGallery}
        <h3>Observaciones</h3><p>${escapeHtml(state.visit.observaciones) || "Sin observaciones registradas"}</p>
        <h3>Recomendaciones al cliente</h3><p>${escapeHtml(state.visit.recomendaciones) || "Pendiente de completar"}</p>
      </div>
    </section>`;
}

function renderEmailPage() {
  return `
    <section class="panel">
      <h2>Preparar correo en Outlook Web</h2>
      <div class="grid2">
        ${visitField("emailCliente", "Correo del cliente", "email")}
        ${visitField("copia", "Copia", "email")}
        ${visitField("asunto", "Asunto", "input", true)}
      </div>
      <p class="muted">Primero guarda el informe como PDF. Después abre Outlook Web y adjunta manualmente el PDF descargado.</p>
      <div class="actions">
        <button class="btn" data-print>Guardar informe como PDF</button>
        <button class="btn primary" data-email>Abrir Outlook Web</button>
      </div>
    </section>`;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      current = Number(button.dataset.tab);
      render();
    });
  });

  document.querySelectorAll("[data-visit-field]").forEach(input => {
    input.addEventListener("input", () => {
      state.visit[input.dataset.visitField] = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-equipment-id]").forEach(input => {
    input.addEventListener("input", () => {
      const equipment = state.equipment.find(item => item.id === input.dataset.equipmentId);
      if (!equipment) return;
      equipment[input.dataset.group][Number(input.dataset.index)].value = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-add-equipment]").forEach(button => {
    button.addEventListener("click", () => {
      state.equipment.push(makeEquipment(button.dataset.addEquipment));
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-delete-equipment]").forEach(button => {
    button.addEventListener("click", () => {
      state.equipment = state.equipment.filter(item => item.id !== button.dataset.deleteEquipment);
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-photo-caption]").forEach(input => {
    input.addEventListener("input", () => {
      const photo = state.photos.find(item => item.id === input.dataset.photoCaption);
      if (photo) photo.caption = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-delete-photo]").forEach(button => {
    button.addEventListener("click", () => {
      state.photos = state.photos.filter(item => item.id !== button.dataset.deletePhoto);
      saveState();
      render();
    });
  });

  document.querySelector("#photoInput")?.addEventListener("change", handlePhotos);
  document.querySelector("[data-next]")?.addEventListener("click", () => {
    current = Math.min(3, current + 1);
    render();
  });
  document.querySelector("[data-save]")?.addEventListener("click", () => saveState(true));
  document.querySelectorAll("[data-print]").forEach(button => button.addEventListener("click", printReport));
  document.querySelector("[data-email]")?.addEventListener("click", openOutlookWeb);
}

async function handlePhotos(event) {
  const files = Array.from(event.target.files || []);
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const dataUrl = await resizeImage(file, 1400, 0.78);
      state.photos.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        caption: "",
        dataUrl
      });
    } catch (error) {
      console.warn("No se pudo procesar una fotografía.", error);
      notify("Una fotografía no pudo procesarse");
    }
  }
  saveState();
  render();
}

function resizeImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function printReport() {
  if (current !== 2) {
    current = 2;
    render();
  }
  setTimeout(() => window.print(), 150);
}

function openOutlookWeb() {
  const visit = state.visit;
  if (!visit.emailCliente || !visit.emailCliente.includes("@")) {
    notify("Introduce un correo válido del cliente");
    return;
  }

  const body = `Estimado/a:\n\nJunto con saludar, comparto el informe de la visita realizada en ${visit.planta || "la planta"} el ${visit.fecha}.\n\nObjetivo de la visita:\n${visit.objetivo || ""}\n\nObservaciones:\n${visit.observaciones || ""}\n\nRecomendaciones:\n${visit.recomendaciones || ""}\n\nEl informe técnico se adjunta en formato PDF.\n\nSaludos cordiales,\n${visit.ingeniero}\nSNF Chile`;

  const parameters = new URLSearchParams({
    to: visit.emailCliente,
    cc: visit.copia || "",
    subject: visit.asunto || "Informe de visita técnica SNF",
    body
  });

  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?${parameters.toString()}`;
  window.open(outlookUrl, "_blank", "noopener,noreferrer");
}

function updateStats() {
  const equipmentCount = document.querySelector("#equipmentCount");
  const dataCount = document.querySelector("#dataCount");
  const recommendationCount = document.querySelector("#recCount");
  if (equipmentCount) equipmentCount.textContent = state.equipment.length;
  if (dataCount) dataCount.textContent = state.equipment.reduce(
    (total, equipment) => total + [...equipment.fields, ...equipment.ops].filter(field => field.value).length,
    0
  );
  if (recommendationCount) recommendationCount.textContent = state.visit.recomendaciones ? "Sí" : "No";
}

function notify(text) {
  const element = document.createElement("div");
  element.className = "notice";
  element.textContent = text;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 2400);
}

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(error => {
      console.warn("No se pudo registrar el service worker.", error);
    });
  });
}
