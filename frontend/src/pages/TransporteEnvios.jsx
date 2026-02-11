// frontend/src/pages/TransporteEnvios.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../AuthContext";

// Debe coincidir con backend/UI
const ESTADO_CREACION_ENVIO = "PENDIENTE POR ASIGNACION";

// -----------------------------
// ICONOS
// -----------------------------
const IconTruck = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconRefresh = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconDots = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="5" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="12" cy="19" r="1.2" />
  </svg>
);

const IconX = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// -----------------------------
// ESTILOS
// -----------------------------
const styles = {
  page: {
    paddingTop: "40px",
    paddingBottom: "40px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    paddingLeft: "10px",
  },
  titleGroup: { display: "flex", alignItems: "center", gap: "15px" },
  iconCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    backgroundColor: "#e0f2fe",
    color: "#0284c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: { fontSize: "1rem", color: "#64748b", marginTop: "4px" },

  statusOk: {
    marginBottom: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "0.85rem",
    fontWeight: "700",
    border: "1px solid #bbf7d0",
  },
  statusError: {
    marginBottom: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "0.85rem",
    fontWeight: "700",
    border: "1px solid #fecaca",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px 30px 30px",
    border: "1px solid #f0f0f0",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  colLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
    gap: "24px",
    alignItems: "flex-start",
  },

  sectionCard: {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "18px 18px 20px",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: 0,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  smallText: { fontSize: "0.85rem", color: "#64748b", lineHeight: "1.4" },

  buttonPrimary: {
    border: "none",
    borderRadius: "10px",
    padding: "0 16px",
    height: "36px",
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
    whiteSpace: "nowrap",
  },
  buttonGhost: {
    borderRadius: "10px",
    padding: "0 12px",
    height: "32px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  buttonDanger: {
    borderRadius: "10px",
    padding: "0 12px",
    height: "32px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  buttonDisabled: { opacity: 0.55, cursor: "not-allowed" },

  searchRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    minWidth: "220px",
  },
  selectSmall: {
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "0.85rem",
    outline: "none",
    background: "#fff",
    color: "#334155",
  },
  inputSmall: {
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "0.85rem",
    outline: "none",
    background: "#fff",
    color: "#334155",
  },

  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "auto",
    background: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
    position: 'relative'
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" },
  th: {
    background: "#f1f5f9",
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontWeight: "900",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    fontSize: "0.70rem",
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  rowAlt: { background: "#f8fafc" },
  hintSmall: {
    marginTop: 4,
    fontSize: "0.70rem",
    color: "#94a3b8",
    lineHeight: 1.15,
    maxWidth: 220,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },

  badgeEstadoUnidad: (estado) => {
    const norm = normEstado(estado);
    const activo = norm === "ACTIVA" || norm === "DISPONIBLE";
    const reserv = norm === "RESERVADA";
    const transit = norm.includes("TRANSITO");

    let bg = "#f1f5f9",
      color = "#475569",
      border = "#e2e8f0";
    if (activo) {
      bg = "#dcfce7";
      color = "#166534";
      border = "#bbf7d0";
    } else if (reserv) {
      bg = "#ffedd5";
      color = "#9a3412";
      border = "#fed7aa";
    } else if (transit) {
      bg = "#dbeafe";
      color = "#1e40af";
      border = "#bfdbfe";
    } else if (norm === "INACTIVA") {
      bg = "#fee2e2";
      color = "#991b1b";
      border = "#fecaca";
    }

    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: "900",
      background: bg,
      color,
      border: `1px solid ${border}`,
      whiteSpace: "nowrap",
    };
  },

  badgeEstadoEnvio: (estado) => {
    const norm = normEstado(estado);
    let bg = "#f1f5f9",
      color = "#475569",
      border = "#e2e8f0";

    if (norm.includes("TERMIN")) {
      bg = "#dcfce7";
      color = "#166534";
      border = "#bbf7d0";
    } else if (norm.includes("PENDIENTE")) {
      bg = "#ffedd5";
      color = "#9a3412";
      border = "#fed7aa";
    } else if (norm.includes("ASIGNAD")) {
      bg = "#e0f2fe";
      color = "#0369a1";
      border = "#bae6fd";
    } else if (norm.includes("LISTO")) {
      bg = "#dbeafe";
      color = "#1e40af";
      border = "#bfdbfe";
    } else if (
      norm.includes("CURSO") ||
      norm.includes("TRANSITO") ||
      norm.includes("RUTA")
    ) {
      bg = "#ede9fe";
      color = "#5b21b6";
      border = "#ddd6fe";
    } else if (norm.includes("CANCEL")) {
      bg = "#fee2e2";
      color = "#991b1b";
      border = "#fecaca";
    }

    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: "900",
      background: bg,
      color,
      border: `1px solid ${border}`,
      whiteSpace: "nowrap",
    };
  },

  pillSmall: {
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "8px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: "800",
  },
  resumenResultados: { fontSize: "0.78rem", color: "#64748b", marginTop: "8px" },

  detalleCard: {
    marginTop: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "0.85rem",
  },
  detalleTitle: {
    fontSize: "0.95rem",
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: "6px",
  },
  detalleLine: { marginBottom: "6px", color: "#475569" },
  detalleLabel: { fontWeight: "900" },

  linkPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #bae6fd",
    background: "#f0f9ff",
    color: "#0369a1",
    padding: "2px 8px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "0.8rem",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 12000,
    padding: "18px",
  },
  modal: {
    width: "100%",
    maxWidth: "760px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    padding: "18px",
    boxSizing: "border-box",
    animation: "scaleUp 0.2s ease-out",
    border: "1px solid #e2e8f0",
    position: "relative",
    maxHeight: "82vh",
    overflow: "auto",
  },
  modalCloseX: {
    position: "absolute",
    top: 10,
    right: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: "10px",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 900,
    color: "#0f172a",
    paddingRight: "44px",
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: "0.9rem",
    color: "#64748b",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "14px",
    marginTop: 10,
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: "900",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: 16,
    borderTop: "1px solid #f1f5f9",
    paddingTop: 14,
  },
  errorText: {
    marginTop: 10,
    fontSize: "0.85rem",
    color: "#b91c1c",
    fontWeight: "800",
    padding: "8px",
    background: "#fee2e2",
    borderRadius: "10px",
  },

  chipOrd: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
    marginRight: "4px",
    marginBottom: "4px",
    cursor: "pointer",
  },

  barOuter: {
    height: 10,
    borderRadius: 999,
    background: "#e2e8f0",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  barInner: (pct, mode) => {
    const clamped = Math.max(0, Math.min(100, pct));
    const bg =
      mode === "bad" ? "#ef4444" : mode === "warn" ? "#f59e0b" : "#22c55e";
    return { width: `${clamped}%`, height: "100%", background: bg };
  },

  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // 🚨 MENU: position fixed y zIndex alto para flotar sobre todo
  menu: {
    position: "fixed", 
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
    minWidth: 220,
    overflow: "hidden",
    zIndex: 99999, 
  },
  menuItem: {
    padding: "10px 12px",
    fontSize: "0.85rem",
    fontWeight: 800,
    color: "#334155",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  menuItemDisabled: { opacity: 0.55, cursor: "not-allowed" },
  menuHint: { fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8" },
};

// -----------------------------
// Keyframes
// -----------------------------
(function ensureKeyframes() {
  if (typeof document === "undefined") return;
  const id = "digras-transporte-scaleup";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerText =
    "@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }";
  document.head.appendChild(style);
})();

// -----------------------------
// Helpers
// -----------------------------
const UNIDAD_ESTADOS = [
  "ACTIVA",
  "INACTIVA",
  "DISPONIBLE",
  "RESERVADA",
  "EN TRANSITO",
];
const ENVIO_ESTADOS_FILTER = [
  { label: "Terminado", value: "TERMINADO" },
  { label: "Pendiente por asignación", value: "PENDIENTE POR ASIGNACION" },
  { label: "Asignado", value: "ASIGNADO" },
  { label: "LISTO_PARA_SALIR", value: "LISTO_PARA_SALIR" },
  { label: "En curso", value: "EN CURSO" },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normEstado(v) {
  return (v ?? "").toString().toUpperCase().replace(/_/g, " ").trim();
}
function normalizeText(v) {
  return (v ?? "").toString().trim().toLowerCase();
}
function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function isFinalEnvioEstado(estado) {
  const s = normEstado(estado);
  return ["TERMINADO", "CERRADO", "FINALIZADO", "ENTREGADO"].includes(s);
}
function isEnvioEditable(estado) {
  return normEstado(estado) === normEstado(ESTADO_CREACION_ENVIO);
}
function getBackendMessage(err) {
  const data = err?.response?.data;
  if (!data) return "Error inesperado.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.error) return String(data.error);
  if (data.message) return String(data.message);
  try {
    return JSON.stringify(data);
  } catch {
    return "Error inesperado.";
  }
}
function getPesoFromObj(obj) {
  if (!obj) return null;
  const candidates = [
    obj.peso_total,
    obj.peso,
    obj.peso_orden,
    obj.peso_total_orden,
    obj.peso_total_kg,
  ];
  for (const c of candidates) {
    if (c === 0) return 0;
    if (c !== undefined && c !== null && String(c).trim() !== "") {
      const n = Number(c);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
async function fetchPesoOrden(apiClient, idOrden) {
  try {
    const r = await apiClient.get(`/ordenes/${idOrden}/`);
    const p = getPesoFromObj(r.data);
    if (p !== null) return p;
  } catch {}
  try {
    const r = await apiClient.get(`/ordenes/${idOrden}/detalles/`);
    const detalles = Array.isArray(r.data) ? r.data : r.data.results || [];
    let sum = 0,
      hadAnyPeso = false;
    for (const d of detalles) {
      const cantidad = toNumber(d.cantidad ?? 0);
      const p1 =
        d.peso_total ?? d.peso ?? d.peso_item ?? d.peso_subtotal;
      const p2 = d.peso_unitario;
      if (
        p1 !== undefined &&
        p1 !== null &&
        String(p1).trim() !== ""
      ) {
        const n = Number(p1);
        if (Number.isFinite(n)) {
          sum += n;
          hadAnyPeso = true;
          continue;
        }
      }
      if (
        p2 !== undefined &&
        p2 !== null &&
        String(p2).trim() !== ""
      ) {
        const n = Number(p2);
        if (Number.isFinite(n)) {
          sum += n * (cantidad || 1);
          hadAnyPeso = true;
        }
      }
    }
    if (hadAnyPeso) return sum;
  } catch {}
  return null;
}

function formatFechaCorta(iso) {
  if (!iso) return "-";
  if (typeof iso !== "string") return String(iso);
  return iso.slice(0, 10);
}
function formatKg(n) {
  const x = toNumber(n);
  return `${x.toFixed(2)} Kg`;
}
function getUtilPct(peso, capacidad) {
  if (!capacidad || capacidad <= 0) return 0;
  return (peso / capacidad) * 100;
}
function getBarMode(pct) {
  if (pct >= 100) return "bad";
  if (pct >= 85) return "warn";
  return "ok";
}

// -----------------------------
// Modal genérico
// -----------------------------
function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth,
}) {
  if (!open) return null;
  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div
        style={{ ...styles.modal, maxWidth: maxWidth || styles.modal.maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={styles.modalCloseX}
          onClick={onClose}
        >
          <IconX />
        </button>
        <h4 style={styles.modalTitle}>{title}</h4>
        {subtitle ? (
          <div style={styles.modalSubtitle}>{subtitle}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  children,
  confirmText = "Confirmar",
  confirmTone = "primary",
  busy,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  const btnStyle =
    confirmTone === "danger"
      ? { ...styles.buttonDanger, height: 36, padding: "0 14px" }
      : { ...styles.buttonPrimary, height: 36, padding: "0 14px" };

  return (
    <div
      style={styles.modalOverlay}
      onMouseDown={busy ? undefined : onClose}
    >
      <div
        style={{ ...styles.modal, maxWidth: "560px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={styles.modalCloseX}
          onClick={busy ? undefined : onClose}
        >
          <IconX />
        </button>
        <h4 style={styles.modalTitle}>{title}</h4>
        <div
          style={{
            marginTop: 10,
            color: "#334155",
            fontSize: "0.92rem",
          }}
        >
          {children}
        </div>

        <div style={styles.modalActions}>
          <button
            type="button"
            style={styles.buttonGhost}
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            style={{
              ...btnStyle,
              ...(busy ? styles.buttonDisabled : {}),
            }}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// COMPONENTE PRINCIPAL
// -----------------------------
export default function TransporteEnvios() {
  const { user } = useAuth();
  const [unidades, setUnidades] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [transportistas, setTransportistas] = useState([]);

  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [loadingTransportistas, setLoadingTransportistas] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);

  const [searchUnidad, setSearchUnidad] = useState("");
  const [filtroEstadoUnidad, setFiltroEstadoUnidad] =
    useState("TODOS");
  const [filtroTransportistaUnidad, setFiltroTransportistaUnidad] =
    useState("TODOS");
  const [sortUnidad, setSortUnidad] = useState("nombre");

  const [searchEnvio, setSearchEnvio] = useState("");
  const [filtroEstadoEnvio, setFiltroEstadoEnvio] =
    useState("TODOS");
  const [filtroUnidadEnvio, setFiltroUnidadEnvio] =
    useState("TODOS");
  const [filtroTransportistaEnvio, setFiltroTransportistaEnvio] =
    useState("TODOS");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pesoMin, setPesoMin] = useState("");
  const [pesoMax, setPesoMax] = useState("");
  const [sortEnvio, setSortEnvio] = useState("recientes");

  // 🚨 RESTAURADO: Variable original para evitar error de referencia
  const [menuEnvioOpenId, setMenuEnvioOpenId] = useState(null);
  // 🚨 NUEVO: Estado para posición del menú flotante
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [busyKey, setBusyKey] = useState(null);

  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [unidadMode, setUnidadMode] = useState("crear");
  const [unidadForm, setUnidadForm] = useState({
    nombre_unidad: "",
    id_usuario: "",
    capacidad_carga: "",
    placa: "",
    estado: "ACTIVA",
  });
  const [unidadFormError, setUnidadFormError] = useState("");

  const [showTransportistaModal, setShowTransportistaModal] =
    useState(false);
  const [transportistaForm, setTransportistaForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    telefono: "",
    password: "",
  });
  const [transportistaFormError, setTransportistaFormError] =
    useState("");

  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [envioMode, setEnvioMode] = useState("crear");
  const [envioForm, setEnvioForm] = useState({
    codigo_envio: "",
    id_unidad: "",
    fecha_salida: todayISO(),
  });
  const [envioFormError, setEnvioFormError] = useState("");

  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState([]);
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState([]);
  const [asignarError, setAsignarError] = useState("");
  const [searchOrden, setSearchOrden] = useState("");

  const [showUnidadInfo, setShowUnidadInfo] = useState(false);
  const [unidadInfo, setUnidadInfo] = useState(null);

  const [showOrdenInfo, setShowOrdenInfo] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState({
    loading: false,
    error: "",
    orden: null,
    detalles: [],
    peso: null,
    cliente: null,
  });

  const [showTransportistaInfo, setShowTransportistaInfo] =
    useState(false);
  const [transportistaInfo, setTransportistaInfo] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    tone: "primary",
    text: null,
    onConfirm: null,
  });

  const syncGuardRef = useRef(false);
  const detalleUnidadRef = useRef(null);
  const detalleEnvioRef = useRef(null);

  // ----------------------------------------------------------------
  // 🔐 CONTROL DE PERMISOS
  // ----------------------------------------------------------------
  const esAdmin = user?.tipo === "ADMINISTRADOR";

  // Auditoría
  const logAccion = async (
    accion,
    descripcion,
    idReferencia = null,
    modulo = "Transporte"
  ) => {
    try {
      await api.post("/base/registros/", {
        modulo,
        accion,
        descripcion,
        id_referencia: idReferencia,
      });
    } catch {}
  };

  const cargarUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const res = await api.get("/base/unidades/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setUnidades(data);
      return data;
    } catch (err) {
      setError(
        getBackendMessage(err) ||
          "No se pudieron cargar las unidades."
      );
      return [];
    } finally {
      setLoadingUnidades(false);
    }
  };

  const cargarEnvios = async () => {
    setLoadingEnvios(true);
    try {
      const res = await api.get("/base/envios/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setEnvios(data);
      return data;
    } catch (err) {
      setError(
        getBackendMessage(err) ||
          "No se pudieron cargar los envíos."
      );
      return [];
    } finally {
      setLoadingEnvios(false);
    }
  };

  const cargarTransportistas = async () => {
    setLoadingTransportistas(true);
    try {
      const res = await api.get("/base/usuarios/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      const solo = data.filter(
        (u) => (u.tipo || "").toUpperCase() === "TRANSPORTISTA"
      );
      setTransportistas(solo);
      return solo;
    } catch {
      return [];
    } finally {
      setLoadingTransportistas(false);
    }
  };

  const syncEstadosUnidadesConEnvios = async (enviosListOpt) => {
    if (syncGuardRef.current) return;
    syncGuardRef.current = true;

    try {
      const enviosList = Array.isArray(enviosListOpt)
        ? enviosListOpt
        : envios;
      if (!Array.isArray(enviosList) || enviosList.length === 0)
        return;

      const updates = [];
      for (const u of unidades) {
        const estadoUnidad = normEstado(u.estado);
        if (estadoUnidad === "INACTIVA") continue;

        const rel = enviosList.filter(
          (e) => String(e.id_unidad) === String(u.id_unidad)
        );
        if (rel.length === 0) continue;

        const anyNoFinal = rel.some(
          (e) => !isFinalEnvioEstado(e.estado)
        );
        if (!anyNoFinal) {
          if (
            estadoUnidad !== "ACTIVA" &&
            estadoUnidad !== "DISPONIBLE"
          )
            updates.push({
              id_unidad: u.id_unidad,
              estado: "ACTIVA",
            });
          continue;
        }

        const anyPendiente = rel.some(
          (e) =>
            normEstado(e.estado) ===
            normEstado(ESTADO_CREACION_ENVIO)
        );
        if (anyPendiente) {
          if (estadoUnidad !== "RESERVADA")
            updates.push({
              id_unidad: u.id_unidad,
              estado: "RESERVADA",
            });
          continue;
        }

        if (!estadoUnidad.includes("TRANSITO"))
          updates.push({
            id_unidad: u.id_unidad,
            estado: "EN TRANSITO",
          });
      }

      for (const up of updates) {
        try {
          await api.patch(`/base/unidades/${up.id_unidad}/`, {
            estado: up.estado,
          });
        } catch {}
      }
      if (updates.length) await cargarUnidades();
    } finally {
      syncGuardRef.current = false;
    }
  };

  useEffect(() => {
    setMensaje("");
    setError("");
    (async () => {
      await cargarUnidades();
      const enviosData = await cargarEnvios();
      await cargarTransportistas();
      await syncEstadosUnidadesConEnvios(enviosData);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 🚨 CAMBIO: Cerrar menú si se hace click fuera
    const onDocClick = () => setMenuEnvioOpenId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const transportistaById = useMemo(() => {
    const m = new Map();
    for (const t of transportistas)
      m.set(String(t.id_usuario ?? t.id), t);
    return m;
  }, [transportistas]);

  const unidadById = useMemo(() => {
    const m = new Map();
    for (const u of unidades) m.set(String(u.id_unidad), u);
    return m;
  }, [unidades]);

  const getUnidadById = (unidadId) =>
    unidadById.get(String(unidadId)) || null;

  const getTransportistaLabel = (userId) => {
    if (!userId) return "-";
    const t = transportistaById.get(String(userId));
    if (!t) return "-";
    const nombre = `${t.first_name || ""} ${
      t.last_name || ""
    }`.trim();
    return nombre || t.username || "-";
  };

  const getTransportistaTelefono = (userId) =>
    transportistaById.get(String(userId))?.telefono || "";

  const getUnidadLabel = (unidadId) => {
    const u = getUnidadById(unidadId);
    if (!u) return "Sin unidad";
    const placa = u.placa ? ` · ${u.placa}` : "";
    return `${u.codigo_unidad || "Unidad"}${placa}`;
  };

  const getOrdenesResumen = (envio) => {
    if (!envio) return [];
    if (Array.isArray(envio.ordenes_detalle))
      return envio.ordenes_detalle;
    if (Array.isArray(envio.ordenes_resumen))
      return envio.ordenes_resumen;
    if (Array.isArray(envio.ordenes)) return envio.ordenes;
    if (Array.isArray(envio.ordenes_ids)) return envio.ordenes_ids;
    return [];
  };

  const getPesoEnvio = (envio) => {
    if (!envio) return { sum: 0, missing: true };
    const listado = getOrdenesResumen(envio);
    let sum = 0,
      missing = false;

    if (Array.isArray(listado) && listado.length > 0) {
      for (const o of listado) {
        if (typeof o === "object" && o !== null) {
          const p = getPesoFromObj(o);
          if (p === null) missing = true;
          else sum += toNumber(p);
        } else missing = true;
      }
    } else {
      const p = getPesoFromObj(envio);
      if (p === null) missing = true;
      else sum = toNumber(p);
    }

    return { sum, missing };
  };

  const getCapUnidad = (unidadId) =>
    toNumber(getUnidadById(unidadId)?.capacidad_carga ?? 0);

  const transportistaOcupadoEnOtraUnidad = (
    userId,
    currentUnidadId = null
  ) => {
    if (!userId) return false;
    return unidades.some((u) => {
      if (String(u.id_usuario) !== String(userId)) return false;
      if (
        currentUnidadId &&
        String(u.id_unidad) === String(currentUnidadId)
      )
        return false;
      return true;
    });
  };

  const unidadTodosEnviosFinalizados = (unidadId) => {
    const relacionados = envios.filter(
      (e) => String(e.id_unidad) === String(unidadId)
    );
    if (relacionados.length === 0) return true;
    return relacionados.every((e) => isFinalEnvioEstado(e.estado));
  };

  const unidadPuedeGestionarse = (unidadId) =>
    unidadTodosEnviosFinalizados(unidadId);

  const unidadBloquearActivarDesactivarPorTransito = (unidadId) =>
    envios.some(
      (e) =>
        String(e.id_unidad) === String(unidadId) &&
        !isFinalEnvioEstado(e.estado)
    );

  const envioActionCaps = (estado) => {
    const s = normEstado(estado);

    if (s === normEstado(ESTADO_CREACION_ENVIO)) {
      return {
        canEdit: true,
        canAssign: true,
        canClose: true,
        canDelete: true,
        reasonShort: "Editable",
        reasonFull:
          "Pendiente por asignación: puedes editar, asignar, cerrar y eliminar.",
      };
    }

    if (s.includes("TERMIN")) {
      return {
        canEdit: false,
        canAssign: false,
        canClose: false,
        canDelete: false,
        reasonShort: "Terminado",
        reasonFull: "Envío terminado: solo lectura.",
      };
    }

    if (
      s.includes("CURSO") ||
      s.includes("TRANSITO") ||
      s.includes("RUTA")
    ) {
      return {
        canEdit: false,
        canAssign: false,
        canClose: false,
        canDelete: false,
        reasonShort: "En curso",
        reasonFull: "En curso / en tránsito: solo lectura.",
      };
    }

    return {
      canEdit: false,
      canAssign: false,
      canClose: false,
      canDelete: false,
      reasonShort: "Asignado",
      reasonFull: "Envío asignado: solo lectura.",
    };
  };

  const unidadesFiltradas = useMemo(() => {
    const t = normalizeText(searchUnidad);
    let list = unidades.filter((u) => {
      const matchTexto =
        !t ||
        (u.codigo_unidad || "").toLowerCase().includes(t) ||
        (u.placa || "").toLowerCase().includes(t);
      const matchEstado =
        filtroEstadoUnidad === "TODOS" ||
        normEstado(u.estado) === normEstado(filtroEstadoUnidad);
      const matchTrans =
        filtroTransportistaUnidad === "TODOS" ||
        String(u.id_usuario) === String(filtroTransportistaUnidad);
      return matchTexto && matchEstado && matchTrans;
    });

    list = list.slice().sort((a, b) => {
      if (sortUnidad === "capacidad")
        return (
          toNumber(b.capacidad_carga) - toNumber(a.capacidad_carga)
        );
      return (a.codigo_unidad || "")
        .toLowerCase()
        .localeCompare((b.codigo_unidad || "").toLowerCase());
    });

    return list;
  }, [
    unidades,
    searchUnidad,
    filtroEstadoUnidad,
    filtroTransportistaUnidad,
    sortUnidad,
  ]);

  const enviosFiltrados = useMemo(() => {
    const t = normalizeText(searchEnvio);
    let list = envios.filter((e) => {
      const matchTexto =
        !t ||
        (e.codigo_envio || "").toLowerCase().includes(t) ||
        (e.estado || "").toLowerCase().includes(t);
      const est = normEstado(e.estado);
      const matchEstado =
        filtroEstadoEnvio === "TODOS" ||
        est === normEstado(filtroEstadoEnvio);
      const matchUnidad =
        filtroUnidadEnvio === "TODOS" ||
        String(e.id_unidad) === String(filtroUnidadEnvio);

      const u = getUnidadById(e.id_unidad);
      const matchTrans =
        filtroTransportistaEnvio === "TODOS" ||
        String(u?.id_usuario || "") ===
          String(filtroTransportistaEnvio);

      const d = e.fecha_salida
        ? formatFechaCorta(e.fecha_salida)
        : "";
      const matchDesde = !fechaDesde || (d && d >= fechaDesde);
      const matchHasta = !fechaHasta || (d && d <= fechaHasta);

      const { sum, missing } = getPesoEnvio(e);
      const peso = missing ? null : sum;
      const min = pesoMin !== "" ? toNumber(pesoMin) : null;
      const max = pesoMax !== "" ? toNumber(pesoMax) : null;
      const matchPesoMin =
        min === null || (peso !== null && peso >= min);
      const matchPesoMax =
        max === null || (peso !== null && peso <= max);

      return (
        matchTexto &&
        matchEstado &&
        matchUnidad &&
        matchTrans &&
        matchDesde &&
        matchHasta &&
        matchPesoMin &&
        matchPesoMax
      );
    });

    list = list.slice().sort((a, b) => {
      const da = a.fecha_salida ? new Date(a.fecha_salida) : new Date(0);
      const db = b.fecha_salida ? new Date(b.fecha_salida) : new Date(0);
      
      const ta = da.getTime();
      const tb = db.getTime();
      
      const ida = toNumber(a.id_envio ?? a.id);
      const idb = toNumber(b.id_envio ?? b.id);
      
      if (sortEnvio === "antiguos") {
        if (ta === tb) {
          return ida - idb; 
        }
        return ta - tb; 
      }
      
      // sortEnvio === "recientes"
      if (ta === tb) {
        return idb - ida; 
      }
      return tb - ta; 
    });

    return list;
  }, [
    envios,
    searchEnvio,
    filtroEstadoEnvio,
    filtroUnidadEnvio,
    filtroTransportistaEnvio,
    fechaDesde,
    fechaHasta,
    pesoMin,
    pesoMax,
    sortEnvio,
    unidades,
    unidadById,
  ]);

  const openConfirm = ({ title, tone = "primary", text, onConfirm }) =>
    setConfirm({ open: true, title, tone, text, onConfirm });
  const closeConfirm = () => {
    if (busyKey) return;
    setConfirm({
      open: false,
      title: "",
      tone: "primary",
      text: null,
      onConfirm: null,
    });
  };

  const handleSeleccionarUnidad = (unidad) => {
    setUnidadSeleccionada(unidad);
    setTimeout(() => {
      if (detalleUnidadRef.current && typeof window !== "undefined") {
        const rect = detalleUnidadRef.current.getBoundingClientRect();
        const top = window.scrollY + rect.top - 120;
        window.scrollTo({
          top: top < 0 ? 0 : top,
          behavior: "smooth",
        });
      }
    }, 0);
  };

  const handleSeleccionarEnvio = (envio) => {
    setEnvioSeleccionado(envio);
    setTimeout(() => {
      if (detalleEnvioRef.current && typeof window !== "undefined") {
        const rect = detalleEnvioRef.current.getBoundingClientRect();
        const top = window.scrollY + rect.top - 120;
        window.scrollTo({
          top: top < 0 ? 0 : top,
          behavior: "smooth",
        });
      }
    }, 0);
  };

  // -------- UNIDADES
  const abrirCrearUnidad = () => {
    setUnidadMode("crear");
    setUnidadForm({
      nombre_unidad: "",
      id_usuario: "",
      capacidad_carga: "",
      placa: "",
      estado: "ACTIVA",
    });
    setUnidadFormError("");
    setUnidadSeleccionada(null);
    setShowUnidadModal(true);
  };

  const abrirEditarUnidad = (unidad) => {
    if (!unidad) return;
    if (!unidadPuedeGestionarse(unidad.id_unidad))
      return toast.error(
        "Solo puedes editar unidades sin envíos o con todos los envíos terminados."
      );
    setUnidadMode("editar");
    setUnidadSeleccionada(unidad);
    setUnidadForm({
      nombre_unidad: unidad.codigo_unidad || "",
      id_usuario: unidad.id_usuario || "",
      capacidad_carga: unidad.capacidad_carga ?? "",
      placa: unidad.placa || "",
      estado: unidad.estado || "ACTIVA",
    });
    setUnidadFormError("");
    setShowUnidadModal(true);
  };

  const guardarUnidad = async (e) => {
    e.preventDefault();
    if (busyKey) return;

    setUnidadFormError("");
    setMensaje("");

    try {
      if (!unidadForm.nombre_unidad)
        return setUnidadFormError(
          "El nombre de unidad es obligatorio."
        );
      if ((unidadForm.nombre_unidad || "").length > 15)
        return setUnidadFormError(
          "Máximo 15 caracteres para nombre de unidad."
        );

      if (!unidadForm.placa)
        return setUnidadFormError("La placa es obligatoria.");
      const placaLen = (unidadForm.placa || "").trim().length;
      if (placaLen < 6 || placaLen > 10)
        return setUnidadFormError(
          "La placa debe tener entre 6 y 10 caracteres."
        );

      if (!unidadForm.id_usuario)
        return setUnidadFormError(
          "Debes seleccionar un transportista."
        );

      if (
        unidadForm.capacidad_carga === "" ||
        unidadForm.capacidad_carga === null
      )
        return setUnidadFormError(
          "La capacidad de carga es obligatoria."
        );
      const capNum = Number(unidadForm.capacidad_carga);
      if (!Number.isFinite(capNum) || capNum <= 0)
        return setUnidadFormError(
          "La capacidad de carga debe ser un número mayor a 0."
        );

      if (!unidadForm.estado)
        return setUnidadFormError(
          "Debes seleccionar un estado para la unidad."
        );

      const yaAsignado = transportistaOcupadoEnOtraUnidad(
        unidadForm.id_usuario,
        unidadMode === "editar" && unidadSeleccionada
          ? unidadSeleccionada.id_unidad
          : null
      );
      if (yaAsignado)
        return setUnidadFormError(
          "Este transportista ya está asignado a otra unidad."
        );

      const telefonoAsociado = getTransportistaTelefono(
        unidadForm.id_usuario
      );

      const payload = {
        codigo_unidad: unidadForm.nombre_unidad,
        id_usuario: unidadForm.id_usuario,
        telefono: telefonoAsociado,
        placa: unidadForm.placa,
        estado: unidadForm.estado,
        capacidad_carga: capNum,
      };

      setBusyKey("unidad:save");
      if (unidadMode === "crear") {
        const r = await api.post("/base/unidades/", payload);
        toast.success("Unidad creada.");
        setMensaje("Unidad creada correctamente.");
        await logAccion(
          "Crear unidad",
          `Se creó la unidad ${payload.codigo_unidad}.`,
          r.data?.id_unidad ?? null,
          "Unidades"
        );
      } else if (unidadMode === "editar" && unidadSeleccionada) {
        await api.patch(
          `/base/unidades/${unidadSeleccionada.id_unidad}/`,
          payload
        );
        toast.success("Unidad actualizada.");
        setMensaje("Unidad actualizada correctamente.");
        await logAccion(
          "Editar unidad",
          `Se editó la unidad ${payload.codigo_unidad}.`,
          unidadSeleccionada.id_unidad,
          "Unidades"
        );
      }

      setShowUnidadModal(false);
      setUnidadSeleccionada(null);
      await cargarUnidades();
    } catch (err) {
      const msg = getBackendMessage(err);
      setUnidadFormError(msg || "No se pudo guardar la unidad.");
      toast.error(msg || "No se pudo guardar la unidad.");
    } finally {
      setBusyKey(null);
    }
  };

  const eliminarUnidad = (unidad) => {
    if (!unidad) return;
    const relacionados = envios.filter(
      (e) => String(e.id_unidad) === String(unidad.id_unidad)
    );
    if (relacionados.length > 0) {
      toast.error(
        "Solo puedes eliminar unidades que no tengan ningún envío relacionado."
      );
      return;
    }
    openConfirm({
      title: "Eliminar unidad",
      tone: "danger",
      text: (
        <div>
          <div style={{ marginBottom: 8 }}>
            ¿Seguro que deseas eliminar la unidad{" "}
            <b>{unidad.codigo_unidad}</b>?
          </div>
          <div style={{ color: "#64748b" }}>
            Esta acción no se puede deshacer. Solo es posible si la
            unidad no tiene ningún envío registrado (ni activos ni
            finalizados).
          </div>
        </div>
      ),
      onConfirm: async () => {
        if (busyKey) return;
        setBusyKey(`unidad:delete:${unidad.id_unidad}`);
        try {
          await api.delete(`/base/unidades/${unidad.id_unidad}/`);
          toast.success("Unidad eliminada.");
          setMensaje(`Unidad ${unidad.codigo_unidad} eliminada.`);
          await logAccion(
            "Eliminar unidad",
            `Se eliminó la unidad ${unidad.codigo_unidad}.`,
            unidad.id_unidad,
            "Unidades"
          );
          await cargarUnidades();
          setUnidadSeleccionada(null);
          closeConfirm();
        } catch (err) {
          toast.error(
            getBackendMessage(err) ||
              "No se pudo eliminar la unidad."
          );
        } finally {
          setBusyKey(null);
        }
      },
    });
  };

  const toggleUnidadEstado = (unidad, targetEstado) => {
    if (!unidad) return;
    if (
      unidadBloquearActivarDesactivarPorTransito(
        unidad.id_unidad
      )
    ) {
      toast.error(
        "No puedes activar/desactivar: esta unidad tiene envíos activos (en tránsito/en curso/asignados)."
      );
      return;
    }

    if (targetEstado === "INACTIVA") {
      openConfirm({
        title: "Desactivar unidad",
        tone: "danger",
        text: (
          <div>
            <div style={{ marginBottom: 8 }}>
              Unidad: <b>{unidad.codigo_unidad}</b> · Placa:{" "}
              <b>{unidad.placa || "-"}</b>
            </div>
            <div style={{ color: "#64748b" }}>
              La unidad quedará fuera de uso y el chofer asignado
              será liberado.
            </div>
          </div>
        ),
        onConfirm: async () => {
          if (busyKey) return;
          setBusyKey(`unidad:toggle:${unidad.id_unidad}`);
          try {
            await api.patch(
              `/base/unidades/${unidad.id_unidad}/`,
              { estado: "INACTIVA", id_usuario: null }
            );
            toast.success(
              `Unidad ${unidad.codigo_unidad} desactivada y chofer liberado.`
            );
            setMensaje(
              `Unidad ${unidad.codigo_unidad} desactivada.`
            );
            await logAccion(
              "Desactivar unidad",
              `Unidad ${unidad.codigo_unidad} => INACTIVA y chofer liberado.`,
              unidad.id_unidad,
              "Unidades"
            );
            await cargarUnidades();
            closeConfirm();
          } catch (err) {
            toast.error(
              getBackendMessage(err) ||
                "No se pudo desactivar la unidad."
            );
          } finally {
            setBusyKey(null);
          }
        },
      });
      return;
    }

    if (targetEstado === "ACTIVA" && !unidad.id_usuario) {
      let setChoferId;
      let setModalError;
      function ChoferSelectorModal({ open, onClose, onConfirm }) {
        const [localChoferId, setLocalChoferId] = useState("");
        const [localError, setLocalError] = useState("");

        const [nuevoForm, setNuevoForm] = useState({
          username: "",
          first_name: "",
          last_name: "",
          telefono: "",
          password: "",
        });
        const [nuevoError, setNuevoError] = useState("");
        const [creating, setCreating] = useState(false);

        setChoferId = setLocalChoferId;
        setModalError = setLocalError;

        const disponibles = transportistas.filter((t) => {
          const tid = String(t.id_usuario ?? t.id);
          return !unidades.some(
            (u) =>
              String(u.id_usuario) === tid &&
              String(u.id_unidad) !== String(unidad.id_unidad) &&
              normEstado(u.estado) !== "INACTIVA"
          );
        });

        const handleSubmitAsignar = (e) => {
          e.preventDefault();
          if (!localChoferId) {
            setLocalError("Selecciona un chofer para asignar.");
            return;
          }
          onConfirm(localChoferId);
        };

        const handleCrearNuevo = async (e) => {
          e.preventDefault();
          setNuevoError("");

          if (
            !nuevoForm.username ||
            !nuevoForm.first_name ||
            !nuevoForm.last_name ||
            !nuevoForm.telefono ||
            !nuevoForm.password
          ) {
            setNuevoError(
              "Todos los campos del nuevo transportista son obligatorios."
            );
            return;
          }

          const payload = {
            username: nuevoForm.username,
            first_name: nuevoForm.first_name,
            last_name: nuevoForm.last_name,
            telefono: nuevoForm.telefono,
            password: nuevoForm.password,
            tipo: "TRANSPORTISTA",
          };

          try {
            setCreating(true);
            const res = await api.post("/base/usuarios/", payload);
            toast.success("Transportista creado.");
            await logAccion(
              "Crear transportista",
              `Se creó el transportista ${payload.username}.`,
              res.data?.id_usuario ?? null,
              "Usuarios"
            );

            await cargarTransportistas();
            const idNuevo = res.data?.id_usuario ?? res.data?.id;
            if (idNuevo) {
              setLocalChoferId(String(idNuevo));
              setLocalError("");
            }
          } catch (err) {
            const msg = getBackendMessage(err);
            setNuevoError(
              msg || "No se pudo crear el transportista."
            );
            toast.error(msg || "No se pudo crear el transportista.");
          } finally {
            setCreating(false);
          }
        };

        return (
          <ModalShell
            open={open}
            title="Asignar chofer a unidad"
            subtitle={`Selecciona o crea un chofer disponible para la unidad ${unidad.codigo_unidad}`}
            onClose={onClose}
            maxWidth={460}
          >
            <form onSubmit={handleSubmitAsignar}>
              <label style={styles.label}>Chofer disponible</label>
              <select
                style={styles.select}
                value={localChoferId}
                onChange={(e) => {
                  setLocalChoferId(e.target.value);
                  setLocalError("");
                }}
              >
                <option value="">Selecciona chofer</option>
                {disponibles.map((t) => {
                  const tid = t.id_usuario ?? t.id;
                  const nombre =
                    `${t.first_name || ""} ${t.last_name || ""}`.trim() ||
                    t.username;
                  return (
                    <option key={tid} value={tid}>
                      {nombre} ({t.username})
                    </option>
                  );
                })}
              </select>
              {localError ? (
                <div style={styles.errorText}>{localError}</div>
              ) : null}

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid #e2e8f0",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 900,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  Crear nuevo transportista
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#64748b",
                    marginBottom: 10,
                  }}
                >
                  Si el chofer aún no está registrado, puedes crearlo aquí mismo.
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div>
                    <label style={styles.label}>Usuario</label>
                    <input
                      style={styles.input}
                      value={nuevoForm.username}
                      onChange={(e) =>
                        setNuevoForm((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Nombre de usuario"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Nombre</label>
                    <input
                      style={styles.input}
                      value={nuevoForm.first_name}
                      onChange={(e) =>
                        setNuevoForm((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Apellido</label>
                    <input
                      style={styles.input}
                      value={nuevoForm.last_name}
                      onChange={(e) =>
                        setNuevoForm((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      placeholder="Apellido"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Teléfono</label>
                    <input
                      style={styles.input}
                      value={nuevoForm.telefono}
                      onChange={(e) =>
                        setNuevoForm((prev) => ({
                          ...prev,
                          telefono: e.target.value,
                        }))
                      }
                      placeholder="Teléfono de contacto"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Contraseña</label>
                    <input
                      type="password"
                      style={styles.input}
                      value={nuevoForm.password}
                      onChange={(e) =>
                        setNuevoForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Ingresa una contraseña"
                    />
                  </div>
                </div>

                {nuevoError ? (
                  <div style={styles.errorText}>{nuevoError}</div>
                ) : null}
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  onClick={onClose}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.buttonPrimary,
                    ...(creating ? styles.buttonDisabled : {}),
                  }}
                  disabled={creating}
                  onClick={handleCrearNuevo}
                >
                  {creating ? "Creando..." : "Crear transportista"}
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={creating}
                >
                  Asignar y activar
                </button>
              </div>
            </form>
          </ModalShell>
        );
      }
      function ChoferSelectorWrapper() {
        const [open, setOpen] = useState(true);
        if (!open) return null;
        return (
          <ChoferSelectorModal
            open={open}
            onClose={() => {
              setOpen(false);
              closeConfirm();
            }}
            onConfirm={async (choferIdSel) => {
              if (!choferIdSel) {
                setModalError &&
                  setModalError(
                    "Selecciona un chofer para asignar."
                  );
                return;
              }
              setBusyKey(
                `unidad:reactivate:${unidad.id_unidad}`
              );
              try {
                await api.patch(
                  `/base/unidades/${unidad.id_unidad}/`,
                  { estado: "ACTIVA", id_usuario: choferIdSel }
                );
                toast.success(
                  `Unidad ${unidad.codigo_unidad} activada y chofer asignado.`
                );
                setMensaje(
                  `Unidad ${unidad.codigo_unidad} activada.`
                );
                await logAccion(
                  "Activar unidad",
                  `Unidad ${unidad.codigo_unidad} => ACTIVA y chofer asignado.`,
                  unidad.id_unidad,
                  "Unidades"
                );
                await cargarUnidades();
                setOpen(false);
                closeConfirm();
              } catch (err) {
                toast.error(
                  getBackendMessage(err) ||
                    "No se pudo activar la unidad."
                );
              } finally {
                setBusyKey(null);
              }
            }}
          />
        );
      }
      openConfirm({
        title: "Asignar chofer a unidad",
        text: <ChoferSelectorWrapper />,
        tone: "primary",
        onConfirm: () => {},
      });
      return;
    }

    openConfirm({
      title: "Activar unidad",
      tone: "primary",
      text: (
        <div>
          <div style={{ marginBottom: 8 }}>
            Unidad: <b>{unidad.codigo_unidad}</b> · Placa:{" "}
            <b>{unidad.placa || "-"}</b>
          </div>
          <div style={{ color: "#64748b" }}>
            La unidad volverá a estar disponible para asignaciones.
          </div>
        </div>
      ),
      onConfirm: async () => {
        if (busyKey) return;
        setBusyKey(`unidad:toggle:${unidad.id_unidad}`);
        try {
          await api.patch(
            `/base/unidades/${unidad.id_unidad}/`,
            { estado: "ACTIVA" }
          );
          toast.success(`Unidad ${unidad.codigo_unidad} activada.`);
          setMensaje(
            `Unidad ${unidad.codigo_unidad} activada.`
          );
          await logAccion(
            "Activar unidad",
            `Unidad ${unidad.codigo_unidad} => ACTIVA.`,
            unidad.id_unidad,
            "Unidades"
          );
          await cargarUnidades();
          closeConfirm();
        } catch (err) {
          toast.error(
            getBackendMessage(err) ||
              "No se pudo activar la unidad."
          );
        } finally {
          setBusyKey(null);
        }
      },
    });
  };

  // -------- TRANSPORTISTA
  const abrirNuevoTransportista = () => {
    setTransportistaForm({
      username: "",
      first_name: "",
      last_name: "",
      telefono: "",
      password: "",
    });
    setTransportistaFormError("");
    setShowTransportistaModal(true);
  };

  const guardarTransportista = async (e) => {
    e.preventDefault();
    if (busyKey) return;

    setTransportistaFormError("");

    try {
      if (
        !transportistaForm.username ||
        !transportistaForm.first_name ||
        !transportistaForm.last_name ||
        !transportistaForm.telefono ||
        !transportistaForm.password
      ) {
        return setTransportistaFormError(
          "Todos los campos son obligatorios."
        );
      }

      const payload = {
        username: transportistaForm.username,
        first_name: transportistaForm.first_name,
        last_name: transportistaForm.last_name,
        telefono: transportistaForm.telefono,
        password: transportistaForm.password,
        tipo: "TRANSPORTISTA",
      };

      setBusyKey("transportista:create");
      const res = await api.post("/base/usuarios/", payload);
      toast.success("Transportista creado.");
      await logAccion(
        "Crear transportista",
        `Se creó el transportista ${payload.username}.`,
        res.data?.id_usuario ?? null,
        "Usuarios"
      );

      await cargarTransportistas();
      const idNuevo = res.data?.id_usuario ?? res.data?.id;
      if (idNuevo)
        setUnidadForm((prev) => ({
          ...prev,
          id_usuario: idNuevo,
        }));
      setShowTransportistaModal(false);
    } catch (err) {
      const msg = getBackendMessage(err);
      setTransportistaFormError(
        msg || "No se pudo crear el transportista."
      );
      toast.error(msg || "No se pudo crear el transportista.");
    } finally {
      setBusyKey(null);
    }
  };

  // -------- ENVÍOS
  const abrirCrearEnvio = () => {
    setEnvioMode("crear");
    setEnvioSeleccionado(null);
    setEnvioForm({
      codigo_envio: "Se generará automáticamente",
      id_unidad: "",
      fecha_salida: todayISO(),
    });
    setEnvioFormError("");
    setShowEnvioModal(true);
  };

  const abrirEditarEnvio = (envio) => {
    if (!envio) return;
    if (!isEnvioEditable(envio.estado))
      return toast.error(
        "Solo puedes editar envíos en estado PENDIENTE POR ASIGNACION."
      );
    setEnvioMode("editar");
    setEnvioSeleccionado(envio);
    setEnvioForm({
      codigo_envio: envio.codigo_envio || "",
      id_unidad: envio.id_unidad || "",
      fecha_salida: envio.fecha_salida
        ? formatFechaCorta(envio.fecha_salida)
        : todayISO(),
    });
    setEnvioFormError("");
    setShowEnvioModal(true);
  };

  const guardarEnvio = async (e) => {
    e.preventDefault();
    if (busyKey) return;

    setEnvioFormError("");
    setMensaje("");

    try {
      if (!envioForm.id_unidad)
        return setEnvioFormError(
          "Debes seleccionar una unidad de transporte."
        );
      if (!envioForm.fecha_salida)
        return setEnvioFormError(
          "La fecha de salida es obligatoria."
        );

      const fecha = envioForm.fecha_salida;
      if (fecha < todayISO())
        return setEnvioFormError(
          "La fecha de salida no puede ser anterior a hoy."
        );

      const unidadObj = getUnidadById(envioForm.id_unidad);
      if (!unidadObj)
        return setEnvioFormError(
          "La unidad seleccionada no existe."
        );
      const estadoUnidadNorm = normEstado(unidadObj.estado);
      const esMismoEnvioEnEdicion =
        envioMode === "editar" &&
        envioSeleccionado &&
        String(unidadObj.id_unidad) ===
          String(envioSeleccionado.id_unidad);
      const estadoPermitido =
        estadoUnidadNorm === "ACTIVA" ||
        estadoUnidadNorm === "DISPONIBLE" ||
        esMismoEnvioEnEdicion;
      if (!estadoPermitido)
        return setEnvioFormError(
          "Solo puedes asignar envíos a unidades ACTIVAS o DISPONIBLES."
        );

      const ignoreEnvioId =
        envioMode === "editar" && envioSeleccionado
          ? envioSeleccionado.id_envio
          : null;
      const unidadEnUso = envios.some((ev) => {
        if (
          String(ev.id_unidad) !== String(envioForm.id_unidad)
        )
          return false;
        if (
          ignoreEnvioId &&
          String(ev.id_envio) === String(ignoreEnvioId)
        )
          return false;
        return !isFinalEnvioEstado(ev.estado);
      });
      if (unidadEnUso)
        return setEnvioFormError(
          "Esta unidad ya tiene un envío activo asignado. Selecciona otra."
        );

      if (envioMode === "editar" && envioSeleccionado) {
        const capacidad = getCapUnidad(envioForm.id_unidad);
        const ordenesIds = getOrdenesResumen(
          envioSeleccionado
        ).map((o) => (typeof o === "object" ? o.id_orden : o));
        if (capacidad > 0 && ordenesIds.length) {
          let sumPeso = 0;
          for (const id of ordenesIds) {
            const p = await fetchPesoOrden(api, id);
            if (p === null)
              return setEnvioFormError(
                `No se pudo obtener el peso de la orden #${id}.`
              );
            sumPeso += p;
          }
          if (sumPeso >= capacidad)
            return setEnvioFormError(
              `No permitido: peso total (${sumPeso}) >= capacidad (${capacidad}).`
            );
        }
      }

      const payload = {
        id_unidad: envioForm.id_unidad,
        estado: ESTADO_CREACION_ENVIO,
        fecha_salida: `${fecha}T00:00:00`,
      };

      setBusyKey("envio:save");
      if (envioMode === "crear") {
        const res = await api.post("/base/envios/", payload);
        const creado = res.data;

        try {
          await api.patch(
            `/base/unidades/${envioForm.id_unidad}/`,
            { estado: "RESERVADA" }
          );
        } catch {}

        toast.success(
          "Envío creado. Ahora asigna las órdenes."
        );
        setMensaje(
          "Envío creado correctamente. Ahora asigna las órdenes."
        );
        await logAccion(
          "Crear envío",
          `Se creó el envío ${creado.codigo_envio}.`,
          creado.id_envio,
          "Envíos"
        );

        setShowEnvioModal(false);

        const enviosData = await cargarEnvios();
        await cargarUnidades();
        await syncEstadosUnidadesConEnvios(enviosData);

        await abrirAsignarOrdenes(creado);
      } else if (envioMode === "editar" && envioSeleccionado) {
        await api.patch(
          `/base/envios/${envioSeleccionado.id_envio}/`,
          payload
        );
        try {
          await api.patch(
            `/base/unidades/${envioForm.id_unidad}/`,
            { estado: "RESERVADA" }
          );
        } catch {}

        toast.success("Envío actualizado.");
        setMensaje("Envío actualizado correctamente.");
        await logAccion(
          "Editar envío",
          `Se editó el envío ${envioSeleccionado.codigo_envio}.`,
          envioSeleccionado.id_envio,
          "Envíos"
        );

        setShowEnvioModal(false);
        setEnvioSeleccionado(null);

        const enviosData = await cargarEnvios();
        await cargarUnidades();
        await syncEstadosUnidadesConEnvios(enviosData);
      }
    } catch (err) {
      const msg = getBackendMessage(err);
      setEnvioFormError(msg || "No se pudo guardar el envío.");
      toast.error(msg || "No se pudo guardar el envío.");
    } finally {
      setBusyKey(null);
    }
  };

  const cerrarEnvio = (envio) => {
    if (!envio) return;
    if (
      normEstado(envio.estado) !==
      normEstado(ESTADO_CREACION_ENVIO)
    )
      return toast.error(
        "Solo puedes cerrar envíos en PENDIENTE POR ASIGNACION."
      );

    const u = getUnidadById(envio.id_unidad);
    const capacidad = getCapUnidad(envio.id_unidad);
    const { sum, missing } = getPesoEnvio(envio);
    const pct = getUtilPct(sum, capacidad);
    const ordenesResumen = getOrdenesResumen(envio);
    const transportistaNombre = getTransportistaLabel(
      u?.id_usuario
    );

    openConfirm({
      title: "Cerrar envío",
      tone: "primary",
      text: (
        <div>
          <div style={{ marginBottom: 8 }}>
            Envío: <b>{envio.codigo_envio}</b>
          </div>
          <div
            style={{
              marginBottom: 4,
              color: "#334155",
            }}
          >
            Unidad: <b>{u?.codigo_unidad || "-"}</b> · Placa:{" "}
            <b>{u?.placa || "-"}</b>
          </div>
          <div
            style={{
              marginBottom: 4,
              color: "#334155",
            }}
          >
            Transportista: <b>{transportistaNombre}</b>
          </div>
          <div
            style={{
              marginBottom: 4,
              color: "#334155",
            }}
          >
            Fecha de salida:{" "}
            <b>{formatFechaCorta(envio.fecha_salida)}</b>
          </div>
          <div
            style={{
              marginBottom: 8,
              color: "#334155",
            }}
          >
            Órdenes asignadas:{" "}
            <b>
              {Array.isArray(ordenesResumen)
                ? ordenesResumen.length
                : 0}
            </b>
          </div>
          {Array.isArray(ordenesResumen) &&
          ordenesResumen.length ? (
            <div
              style={{
                marginBottom: 10,
                fontSize: "0.78rem",
                color: "#64748b",
              }}
            >
              {ordenesResumen.slice(0, 5).map((o) => {
                const id =
                  typeof o === "object" ? o.id_orden : o;
                return (
                  <span
                    key={id}
                    style={{
                      ...styles.chipOrd,
                      cursor: "default",
                    }}
                  >
                    #{id}
                  </span>
                );
              })}
              {ordenesResumen.length > 5 ? (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginLeft: 4,
                  }}
                >
                  +{ordenesResumen.length - 5} más
                </span>
              ) : null}
            </div>
          ) : null}
          <div
            style={{
              marginBottom: 8,
              color: "#334155",
            }}
          >
            Capacidad unidad:{" "}
            <b>
              {capacidad ? formatKg(capacidad) : "No definida"}
            </b>
          </div>
          <div
            style={{
              marginBottom: 8,
              color: "#334155",
            }}
          >
            Peso del envío:{" "}
            <b>
              {missing ? "No disponible" : formatKg(sum)}
            </b>
          </div>
          {capacidad ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...styles.barOuter, marginBottom: 6 }}>
                <div
                  style={styles.barInner(
                    pct,
                    getBarMode(pct)
                  )}
                />
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                }}
              >
                Utilización: {pct.toFixed(1)}%
              </div>
            </div>
          ) : null}
          <div style={{ color: "#64748b" }}>
            Al cerrar, ya no podrás agregar más órdenes a este
            envío.
          </div>
        </div>
      ),
      onConfirm: async () => {
        if (busyKey) return;

        if (!capacidad || capacidad <= 0)
          return toast.error(
            "No se pudo validar la capacidad de la unidad."
          );

        const ordenesIds = getOrdenesResumen(envio).map((o) =>
          typeof o === "object" ? o.id_orden : o
        );
        let sumPeso = 0;
        for (const id of ordenesIds) {
          const p = await fetchPesoOrden(api, id);
          if (p === null)
            return toast.error(
              `No se pudo obtener el peso de la orden #${id}.`
            );
          sumPeso += p;
        }
        if (sumPeso >= capacidad)
          return toast.error(
            `No permitido: peso total (${sumPeso}) >= capacidad (${capacidad}).`
          );

        setBusyKey(`envio:close:${envio.id_envio}`);
        try {
          await api.patch(
            `/base/envios/${envio.id_envio}/`,
            { estado: "ASIGNADO" }
          );
          try {
            await api.patch(
              `/base/unidades/${envio.id_unidad}/`,
              { estado: "EN TRANSITO" }
            );
          } catch {}

          toast.success("Envío cerrado y marcado como ASIGNADO.");
          setMensaje(`Envío ${envio.codigo_envio} cerrado.`);
          await logAccion(
            "Cerrar envío",
            `Se cerró el envío ${envio.codigo_envio} (ASIGNADO).`,
            envio.id_envio,
            "Envíos"
          );

          const enviosData = await cargarEnvios();
          await cargarUnidades();
          await syncEstadosUnidadesConEnvios(enviosData);
          setEnvioSeleccionado(null);
          closeConfirm();
        } catch (err) {
          toast.error(
            getBackendMessage(err) ||
              "No se pudo cerrar el envío."
          );
        } finally {
          setBusyKey(null);
        }
      },
    });
  };

  const eliminarEnvio = (envio) => {
    if (!envio) return;

    if (
      normEstado(envio.estado) !==
      normEstado(ESTADO_CREACION_ENVIO)
    ) {
      toast.error(
        "Solo puedes eliminar envíos en PENDIENTE POR ASIGNACION."
      );
      return;
    }

    openConfirm({
      title: "Eliminar envío",
      tone: "danger",
      text: (
        <div>
          <div style={{ marginBottom: 8 }}>
            ¿Seguro que deseas eliminar el envío{" "}
            <b>{envio.codigo_envio}</b>?
          </div>
          <div style={{ color: "#64748b" }}>
            Se liberarán las órdenes y la unidad quedará activa.
          </div>
        </div>
      ),
      onConfirm: async () => {
        if (busyKey) return;
        setBusyKey(`envio:delete:${envio.id_envio}`);

        try {
          // 1) Liberar órdenes (si hay)
          const resumen = getOrdenesResumen(envio) || [];
          const idsOrdenes = resumen
            .map((o) =>
              typeof o === "object" ? o.id_orden : o
            )
            .filter(Boolean);

          if (idsOrdenes.length) {
            await api.post(
              `/base/envios/${envio.id_envio}/remover_ordenes/`,
              { ordenes: idsOrdenes }
            );
          }

          // 2) Eliminar envío
          await api.delete(`/base/envios/${envio.id_envio}/`);

          // 3) Reactivar unidad (fallback)
          try {
            await api.patch(
              `/base/unidades/${envio.id_unidad}/`,
              { estado: "ACTIVA" }
            );
          } catch {}

          toast.success(
            `Envío ${envio.codigo_envio} eliminado.`
          );

          setEnvioSeleccionado((prev) =>
            prev &&
            String(prev.id_envio) === String(envio.id_envio)
              ? null
              : prev
          );

          const enviosData = await cargarEnvios();
          await cargarUnidades();
          await syncEstadosUnidadesConEnvios(enviosData);

          closeConfirm();
        } catch (err) {
          toast.error(
            getBackendMessage(err) ||
              "No se pudo eliminar el envío."
          );
        } finally {
          setBusyKey(null);
        }
      },
    });
  };

  // ASIGNAR ÓRDENES
  const abrirAsignarOrdenes = async (envio) => {
    if (
      normEstado(envio.estado) !==
      normEstado(ESTADO_CREACION_ENVIO)
    )
      return toast.error(
        "Solo puedes asignar órdenes a envíos en PENDIENTE POR ASIGNACION."
      );

    setEnvioSeleccionado(envio);
    setShowAsignarModal(true);
    setAsignarError("");
    setOrdenesSeleccionadas([]);
    setSearchOrden("");

    setBusyKey("asignar:load");
    try {
      const res = await api.get("/ordenes/");
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      const ESTADOS_PERMITIDOS = ["PREPARADA"];
      setOrdenesDisponibles(
        raw.filter(
          (o) =>
            ESTADOS_PERMITIDOS.includes(
              normEstado(o.estado_de_envio)
            ) && !o.id_envio
        )
      );
    } catch (err) {
      setAsignarError(
        getBackendMessage(err) ||
          "No se pudieron cargar las órdenes disponibles."
      );
    } finally {
      setBusyKey(null);
    }
  };

  // Peso base del envío + peso adicional seleccionado en el modal
  const pesoSeleccionado = useMemo(() => {
    if (!envioSeleccionado)
      return {
        base: 0,
        extra: 0,
        sum: 0,
        missingBase: true,
        missingExtra: true,
      };

    const { sum: baseSum, missing: missingBase } =
      getPesoEnvio(envioSeleccionado);

    const selected = ordenesDisponibles.filter((o) =>
      ordenesSeleccionadas.includes(o.id_orden)
    );
    let extraSum = 0;
    let missingExtra = false;
    for (const o of selected) {
      const p = getPesoFromObj(o);
      if (p === null) missingExtra = true;
      else extraSum += toNumber(p);
    }

    return {
      base: baseSum,
      extra: extraSum,
      sum: baseSum + extraSum,
      missingBase,
      missingExtra,
    };
  }, [ordenesDisponibles, ordenesSeleccionadas, envioSeleccionado]);

  const confirmarAsignacion = async () => {
    if (!envioSeleccionado) return;
    if (ordenesSeleccionadas.length === 0)
      return setAsignarError(
        "Selecciona al menos una orden para asignar."
      );

    const capacidad = getCapUnidad(envioSeleccionado.id_unidad);
    if (!capacidad || capacidad <= 0)
      return setAsignarError(
        "La unidad debe tener una capacidad de carga > 0."
      );

    // Peso de las órdenes ya asignadas al envío + nuevas
    const resumenActual = getOrdenesResumen(envioSeleccionado) || [];
    let sumPeso = 0;

    for (const oActual of resumenActual) {
      const idExist =
        typeof oActual === "object"
          ? oActual.id_orden
          : oActual;
      if (!idExist) continue;
      const pExist = await fetchPesoOrden(api, idExist);
      if (pExist === null) {
        setAsignarError(
          `No se pudo obtener el peso de la orden #${idExist}.`
        );
        return;
      }
      sumPeso += pExist;
    }

    for (const id of ordenesSeleccionadas) {
      const o = ordenesDisponibles.find(
        (x) => String(x.id_orden) === String(id)
      );
      let p = getPesoFromObj(o);
      if (p === null) p = await fetchPesoOrden(api, id);
      if (p === null) {
        setAsignarError(
          `No se pudo obtener el peso de la orden #${id}.`
        );
        return;
      }
      sumPeso += p;
    }

    if (sumPeso >= capacidad)
      return setAsignarError(
        `No permitido: peso total (${sumPeso}) >= capacidad (${capacidad}).`
      );

    setAsignarError("");
    setBusyKey("asignar:confirm");
    try {
      await api.post(
        `/base/envios/${envioSeleccionado.id_envio}/asignar_ordenes/`,
        { ordenes: ordenesSeleccionadas }
      );
      toast.success("Órdenes asignadas.");
      setMensaje(
        `Órdenes asignadas al envío ${envioSeleccionado.codigo_envio}. (Peso total estimado: ${sumPeso} / Cap: ${capacidad})`
      );
      await logAccion(
        "Asignar órdenes",
        `Se asignaron ${ordenesSeleccionadas.length} orden(es) al envío ${envioSeleccionado.codigo_envio}.`,
        envioSeleccionado.id_envio,
        "Envíos"
      );

      try {
        await api.patch(
          `/base/unidades/${envioSeleccionado.id_unidad}/`,
          { estado: "RESERVADA" }
        );
      } catch {}

      setShowAsignarModal(false);
      setEnvioSeleccionado(null);

      const enviosData = await cargarEnvios();
      await cargarUnidades();
      await syncEstadosUnidadesConEnvios(enviosData);
    } catch (err) {
      const msg = getBackendMessage(err);
      setAsignarError(
        msg || "No se pudieron asignar las órdenes."
      );
      toast.error(msg || "No se pudieron asignar las órdenes.");
    } finally {
      setBusyKey(null);
    }
  };

  const quitarOrdenDeEnvio = (envio, idOrden) => {
    if (!envio || !idOrden) return;
    if (
      normEstado(envio.estado) !==
      normEstado(ESTADO_CREACION_ENVIO)
    )
      return toast.error(
        "Solo puedes quitar órdenes si el envío está PENDIENTE POR ASIGNACION."
      );

    openConfirm({
      title: "Quitar orden del envío",
      tone: "danger",
      text: (
        <div>
          <div style={{ marginBottom: 8 }}>
            ¿Quitar la orden <b>#{idOrden}</b> del envío{" "}
            <b>{envio.codigo_envio}</b>?
          </div>
          <div style={{ color: "#64748b" }}>
            La orden quedará libre para asignarse a otro envío.
          </div>
        </div>
      ),
      onConfirm: async () => {
        if (busyKey) return;
        setBusyKey(`orden:remove:${idOrden}`);
        try {
          await api.post(
            `/base/envios/${envio.id_envio}/remover_ordenes/`,
            { ordenes: [idOrden] }
          );
          toast.success(
            `Orden #${idOrden} removida del envío.`
          );
          await logAccion(
            "Quitar orden",
            `Se quitó la orden #${idOrden} del envío ${envio.codigo_envio}.`,
            envio.id_envio,
            "Envíos"
          );

          const enviosData = await cargarEnvios();
          await cargarUnidades();
          await syncEstadosUnidadesConEnvios(enviosData);

          const refreshed = enviosData.find(
            (x) =>
              String(x.id_envio) === String(envio.id_envio)
          );
          setEnvioSeleccionado(refreshed || null);

          closeConfirm();
        } catch (err) {
          toast.error(
            getBackendMessage(err) ||
              "No se pudo quitar la orden."
          );
        } finally {
          setBusyKey(null);
        }
      },
    });
  };

  // MODALES INFO
  const abrirModalUnidadInfo = (unidadId) => {
    const u = getUnidadById(unidadId);
    if (!u) return toast.error("No se encontró la unidad.");
    setUnidadInfo(u);
    setShowUnidadInfo(true);
  };

  const abrirModalTransportistaInfo = (userId) => {
    if (!userId) {
      toast.error("No se encontró el transportista.");
      return;
    }
    const t = transportistaById.get(String(userId));
    if (!t) {
      toast.error("No se encontró el transportista.");
      return;
    }
    setTransportistaInfo(t);
    setShowTransportistaInfo(true);
  };

  const abrirModalOrdenInfo = async (idOrden) => {
    setOrdenInfo({
      loading: true,
      error: "",
      orden: null,
      detalles: [],
      peso: null,
      cliente: null,
    });
    setShowOrdenInfo(true);

    try {
      const r = await api.get(`/ordenes/${idOrden}/`);
      const orden = r.data;

      let detalles = [];
      try {
        const r2 = await api.get(`/ordenes/${idOrden}/detalles/`);
        detalles = Array.isArray(r2.data)
          ? r2.data
          : r2.data.results || [];
      } catch {}

      let cliente = null;
      const idCliente = orden?.id_cliente;
      if (idCliente) {
        try {
          const rc = await api.get(`/base/clientes/${idCliente}/`);
          cliente = rc.data;
        } catch {}
      }

      const peso =
        (await fetchPesoOrden(api, idOrden)) ??
        getPesoFromObj(orden);
      setOrdenInfo({
        loading: false,
        error: "",
        orden,
        detalles,
        peso,
        cliente,
      });
    } catch (err) {
      setOrdenInfo({
        loading: false,
        error:
          getBackendMessage(err) ||
          "Error al cargar orden.",
        orden: null,
        detalles: [],
        peso: null,
        cliente: null,
      });
    }
  };

  const renderCapBar = (peso, capacidad) => {
    if (!capacidad || capacidad <= 0)
      return (
        <div
          style={{
            fontSize: "0.78rem",
            color: "#94a3b8",
          }}
        >
          Capacidad no definida.
        </div>
      );
    const pct = getUtilPct(peso, capacidad);
    const mode = getBarMode(pct);
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: "0.82rem",
              color: "#334155",
              fontWeight: 800,
            }}
          >
            {formatKg(peso)} / {formatKg(capacidad)}
          </div>
          <div
            style={{
              fontSize: "0.82rem",
              color:
                mode === "bad"
                  ? "#991b1b"
                  : mode === "warn"
                  ? "#9a3412"
                  : "#166534",
              fontWeight: 900,
            }}
          >
            {pct.toFixed(1)}%
          </div>
        </div>
        <div style={styles.barOuter}>
          <div style={styles.barInner(pct, mode)} />
        </div>
        {pct >= 85 && pct < 100 ? (
          <div
            style={{
              marginTop: 6,
              fontSize: "0.78rem",
              color: "#9a3412",
              fontWeight: 800,
            }}
          >
            Cerca del límite: revisa capacidad.
          </div>
        ) : null}
        {pct >= 100 ? (
          <div
            style={{
              marginTop: 6,
              fontSize: "0.78rem",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            Excede capacidad: no se permitirá confirmar.
          </div>
        ) : null}
      </div>
    );
  };

  // UI
  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <div style={styles.iconCircle}>
            <IconTruck />
          </div>
          <div>
            <h2 style={styles.title}>Transporte y Envíos</h2>
            <p style={styles.subtitle}>
              Gestión de flota, asignación de órdenes y seguimiento.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        {mensaje && <div style={styles.statusOk}>{mensaje}</div>}
        {error && <div style={styles.statusError}>{error}</div>}

        <div style={styles.colLayout}>
          {/* ==================== UNIDADES ==================== */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>
                  Unidades de Transporte
                </h3>
                <div style={styles.smallText}>
                  Gestiona unidades, choferes y capacidad de carga.
                </div>
              </div>
              {/* Ocultar botón CREAR si es admin */}
              {!esAdmin && (
                <button
                  type="button"
                  style={styles.buttonPrimary}
                  onClick={abrirCrearUnidad}
                >
                  <IconPlus /> Nueva Unidad
                </button>
              )}
            </div>

            <div style={styles.searchRow}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconSearch />
                <input
                  style={styles.searchInput}
                  placeholder="Buscar por nombre o placa..."
                  value={searchUnidad}
                  onChange={(e) =>
                    setSearchUnidad(e.target.value)
                  }
                />
              </div>

              <select
                style={styles.selectSmall}
                value={filtroEstadoUnidad}
                onChange={(e) =>
                  setFiltroEstadoUnidad(e.target.value)
                }
              >
                <option value="TODOS">Estado: todos</option>
                {UNIDAD_ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {s === "EN TRANSITO" ? "EN TRÁNSITO" : s}
                  </option>
                ))}
              </select>

              <select
                style={styles.selectSmall}
                value={filtroTransportistaUnidad}
                onChange={(e) =>
                  setFiltroTransportistaUnidad(
                    e.target.value
                  )
                }
              >
                <option value="TODOS">Chofer: todos</option>
                {transportistas.map((t) => {
                  const id = t.id_usuario ?? t.id;
                  return (
                    <option key={id} value={id}>
                      {t.username}
                    </option>
                  );
                })}
              </select>

              <select
                style={styles.selectSmall}
                value={sortUnidad}
                onChange={(e) =>
                  setSortUnidad(e.target.value)
                }
              >
                <option value="nombre">Orden: nombre</option>
                <option value="capacidad">
                  Orden: capacidad
                </option>
              </select>

              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => {
                  setSearchUnidad("");
                  setFiltroEstadoUnidad("TODOS");
                  setFiltroTransportistaUnidad("TODOS");
                  setSortUnidad("nombre");
                }}
              >
                <IconRefresh /> Limpiar
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Unidad</th>
                    <th style={styles.th}>Transportista</th>
                    <th style={styles.th}>Cap. (Kg)</th>
                    <th style={styles.th}>Estado</th>
                    {/* Ocultar columna Acción si es Admin */}
                    {!esAdmin && (
                      <th
                        style={{
                          ...styles.th,
                          textAlign: "center",
                        }}
                      >
                        Acción
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {unidadesFiltradas.length === 0 &&
                  !loadingUnidades ? (
                    <tr>
                      <td
                        colSpan={esAdmin ? 4 : 5}
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: "20px",
                        }}
                      >
                        No hay unidades registradas.
                      </td>
                    </tr>
                  ) : null}

                  {unidadesFiltradas.map((u, idx) => {
                    const seleccionado =
                      unidadSeleccionada?.id_unidad ===
                      u.id_unidad;
                    const rowBase = {
                      ...styles.td,
                      ...(idx % 2 === 1
                        ? styles.rowAlt
                        : {}),
                      backgroundColor: seleccionado
                        ? "#e0f2fe"
                        : undefined,
                    };

                    const puedeGestionar =
                      unidadPuedeGestionarse(u.id_unidad);
                    const bloqueActDes =
                      unidadBloquearActivarDesactivarPorTransito(
                        u.id_unidad
                      );
                    const estadoNorm = normEstado(u.estado);
                    const esActiva =
                      estadoNorm === "ACTIVA" ||
                      estadoNorm === "DISPONIBLE";
                    const tieneEnviosRelacionados = envios.some(
                      (ev) =>
                        String(ev.id_unidad) ===
                        String(u.id_unidad)
                    );
                    const puedeEliminar =
                      !tieneEnviosRelacionados;

                    return (
                      <tr
                        key={u.id_unidad}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          handleSeleccionarUnidad(u)
                        }
                      >
                        <td style={rowBase}>
                          <div
                            style={{
                              fontWeight: 900,
                              color: "#0d47a1",
                              marginBottom: 2,
                            }}
                          >
                            {u.codigo_unidad}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                            }}
                          >
                            Placa: {u.placa || "-"}
                          </div>
                        </td>
                        <td style={rowBase}>
                          <div
                            style={{
                              fontWeight: 800,
                              marginBottom: 2,
                            }}
                          >
                            {getTransportistaLabel(
                              u.id_usuario
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                            }}
                          >
                            Tel:{" "}
                            {u.telefono ||
                              getTransportistaTelefono(
                                u.id_usuario
                              ) ||
                              "-"}
                          </div>
                        </td>
                        <td style={rowBase}>
                          {toNumber(
                            u.capacidad_carga
                          ).toFixed(2)}
                        </td>
                        <td style={rowBase}>
                          <span
                            style={styles.badgeEstadoUnidad(
                              u.estado
                            )}
                          >
                            {u.estado || "N/A"}
                          </span>
                        </td>

                        {/* Ocultar celda Acción si es Admin */}
                        {!esAdmin && (
                          <td
                            style={{
                              ...rowBase,
                              textAlign: "center",
                            }}
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                justifyContent: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                style={{
                                  ...styles.buttonGhost,
                                  ...(!puedeGestionar
                                    ? styles.buttonDisabled
                                    : {}),
                                }}
                                disabled={
                                  !puedeGestionar ||
                                  !!busyKey
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirEditarUnidad(u);
                                }}
                              >
                                {busyKey === "unidad:save"
                                  ? "Guardando..."
                                  : "Editar"}
                              </button>

                              {esActiva ? (
                                <button
                                  type="button"
                                  style={{
                                    ...styles.buttonGhost,
                                    ...(bloqueActDes ||
                                    !puedeGestionar
                                      ? styles.buttonDisabled
                                      : {}),
                                  }}
                                  disabled={
                                    bloqueActDes ||
                                    !puedeGestionar ||
                                    !!busyKey
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUnidadEstado(
                                      u,
                                      "INACTIVA"
                                    );
                                  }}
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  style={{
                                    ...styles.buttonGhost,
                                    ...(bloqueActDes
                                      ? styles.buttonDisabled
                                      : {}),
                                  }}
                                  disabled={
                                    bloqueActDes || !!busyKey
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUnidadEstado(
                                      u,
                                      "ACTIVA"
                                    );
                                  }}
                                >
                                  Activar
                                </button>
                              )}

                              <button
                                type="button"
                                style={{
                                  ...styles.buttonDanger,
                                  ...(!puedeEliminar
                                    ? styles.buttonDisabled
                                    : {}),
                                }}
                                disabled={
                                  !puedeEliminar || !!busyKey
                                }
                                title={
                                  tieneEnviosRelacionados
                                    ? "No puedes eliminar esta unidad porque tiene envíos relacionados."
                                    : "Eliminar unidad"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  eliminarUnidad(u);
                                }}
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {unidadesFiltradas.length > 0 ? (
              <div style={styles.resumenResultados}>
                Mostrando {unidadesFiltradas.length} unidad(es).
              </div>
            ) : null}

            {unidadSeleccionada ? (
              <div
                ref={detalleUnidadRef}
                style={styles.detalleCard}
              >
                <div style={styles.detalleTitle}>
                  Unidad {unidadSeleccionada.codigo_unidad} ·{" "}
                  {unidadSeleccionada.placa || "-"}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Transportista:
                  </span>{" "}
                  {unidadSeleccionada.id_usuario ? (
                    <span
                      style={styles.linkPill}
                      role="button"
                      onClick={() =>
                        abrirModalTransportistaInfo(
                          unidadSeleccionada.id_usuario
                        )
                      }
                    >
                      {getTransportistaLabel(
                        unidadSeleccionada.id_usuario
                      )}
                    </span>
                  ) : (
                    getTransportistaLabel(
                      unidadSeleccionada.id_usuario
                    )
                  )}
                </div>
                <div
                  style={{
                    marginTop: -2,
                    marginBottom: 6,
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                  }}
                >
                  Tip: haz click en el nombre del transportista
                  para ver sus datos.
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Teléfono:
                  </span>{" "}
                  {unidadSeleccionada.telefono ||
                    getTransportistaTelefono(
                      unidadSeleccionada.id_usuario
                    ) ||
                    "-"}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Capacidad:
                  </span>{" "}
                  {formatKg(
                    toNumber(
                      unidadSeleccionada.capacidad_carga || 0
                    )
                  )}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Estado:
                  </span>{" "}
                  <span
                    style={styles.badgeEstadoUnidad(
                      unidadSeleccionada.estado
                    )}
                  >
                    {unidadSeleccionada.estado || "N/A"}
                  </span>
                </div>
              </div>
            ) : null}

            {loadingUnidades ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                Cargando unidades...
              </div>
            ) : null}
          </div>

          {/* ==================== ENVÍOS ==================== */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Envíos</h3>
                <div style={styles.smallText}>
                  Crea envíos, asigna órdenes y gestiona su ciclo.
                </div>
              </div>
              <button
                type="button"
                style={styles.buttonPrimary}
                onClick={abrirCrearEnvio}
              >
                <IconPlus /> Nuevo Envío
              </button>
            </div>

            <div style={styles.searchRow}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconSearch />
                <input
                  style={styles.searchInput}
                  placeholder="Buscar por código o estado..."
                  value={searchEnvio}
                  onChange={(e) =>
                    setSearchEnvio(e.target.value)
                  }
                />
              </div>

              <select
                style={styles.selectSmall}
                value={filtroEstadoEnvio}
                onChange={(e) =>
                  setFiltroEstadoEnvio(e.target.value)
                }
              >
                <option value="TODOS">Estado: todos</option>
                {ENVIO_ESTADOS_FILTER.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                style={styles.selectSmall}
                value={filtroUnidadEnvio}
                onChange={(e) =>
                  setFiltroUnidadEnvio(e.target.value)
                }
              >
                <option value="TODOS">Unidad: todas</option>
                {unidades.map((u) => (
                  <option
                    key={u.id_unidad}
                    value={u.id_unidad}
                  >
                    {u.codigo_unidad}
                  </option>
                ))}
              </select>

              <select
                style={styles.selectSmall}
                value={filtroTransportistaEnvio}
                onChange={(e) =>
                  setFiltroTransportistaEnvio(
                    e.target.value
                  )
                }
              >
                <option value="TODOS">Chofer: todos</option>
                {transportistas.map((t) => {
                  const id = t.id_usuario ?? t.id;
                  return (
                    <option key={id} value={id}>
                      {t.username}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={styles.searchRow}>
              <input
                style={styles.inputSmall}
                type="date"
                value={fechaDesde}
                onChange={(e) =>
                  setFechaDesde(e.target.value)
                }
              />
              <input
                style={styles.inputSmall}
                type="date"
                value={fechaHasta}
                onChange={(e) =>
                  setFechaHasta(e.target.value)
                }
              />
              <input
                style={styles.inputSmall}
                type="number"
                min="0"
                step="0.01"
                value={pesoMin}
                onChange={(e) =>
                  setPesoMin(e.target.value)
                }
                placeholder="Peso min (Kg)"
              />
              <input
                style={styles.inputSmall}
                type="number"
                min="0"
                step="0.01"
                value={pesoMax}
                onChange={(e) =>
                  setPesoMax(e.target.value)
                }
                placeholder="Peso max (Kg)"
              />

              <select
                style={styles.selectSmall}
                value={sortEnvio}
                onChange={(e) =>
                  setSortEnvio(e.target.value)
                }
              >
                <option value="recientes">
                  Orden: más recientes
                </option>
                <option value="antiguos">
                  Orden: más antiguos
                </option>
              </select>

              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => {
                  setSearchEnvio("");
                  setFiltroEstadoEnvio("TODOS");
                  setFiltroUnidadEnvio("TODOS");
                  setFiltroTransportistaEnvio("TODOS");
                  setFechaDesde("");
                  setFechaHasta("");
                  setPesoMin("");
                  setPesoMax("");
                  setSortEnvio("recientes");
                }}
              >
                <IconRefresh /> Limpiar
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Envío</th>
                    <th style={styles.th}>Unidad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Peso</th>
                    <th style={styles.th}>Órdenes</th>
                    <th
                      style={{
                        ...styles.th,
                        textAlign: "center",
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enviosFiltrados.length === 0 &&
                  !loadingEnvios ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: "20px",
                        }}
                      >
                        No hay envíos registrados.
                      </td>
                    </tr>
                  ) : null}

                  {enviosFiltrados.map((e, idx) => {
                    const seleccionado =
                      envioSeleccionado?.id_envio ===
                      e.id_envio;
                    const rowBase = {
                      ...styles.td,
                      ...(idx % 2 === 1
                        ? styles.rowAlt
                        : {}),
                      backgroundColor: seleccionado
                        ? "#e0f2fe"
                        : undefined,
                    };

                    const caps = envioActionCaps(e.estado);
                    const u = getUnidadById(e.id_unidad);
                    const ordenesResumen = getOrdenesResumen(e);
                    const { sum, missing } = getPesoEnvio(e);

                    return (
                      <tr
                        key={e.id_envio}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSeleccionarEnvio(e)}
                      >
                        <td style={rowBase}>
                          <div
                            style={{
                              fontWeight: 900,
                              color: "#0d47a1",
                              marginBottom: 2,
                            }}
                          >
                            {e.codigo_envio}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                            }}
                          >
                            ID: {e.id_envio}
                          </div>
                        </td>
                        <td style={rowBase}>
                          <span style={styles.pillSmall}>
                            {getUnidadLabel(e.id_unidad)}
                          </span>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: "0.72rem",
                              color: "#94a3b8",
                            }}
                          >
                            Chofer:{" "}
                            {getTransportistaLabel(
                              u?.id_usuario
                            )}
                          </div>
                        </td>
                        <td style={rowBase}>
                          <span
                            style={styles.badgeEstadoEnvio(
                              e.estado
                            )}
                          >
                            {String(e.estado || "N/A").replace(
                              /_/g,
                              " "
                            )}
                          </span>
                          <div
                            style={styles.hintSmall}
                            title={caps.reasonFull}
                          >
                            {caps.reasonShort}
                          </div>
                        </td>
                        <td style={rowBase}>
                          {formatFechaCorta(e.fecha_salida)}
                        </td>
                        <td style={rowBase}>
                          {missing ? (
                            <span
                              style={{ color: "#94a3b8" }}
                            >
                              —
                            </span>
                          ) : (
                            formatKg(sum)
                          )}
                        </td>
                        <td style={rowBase}>
                          {Array.isArray(ordenesResumen) &&
                          ordenesResumen.length ? (
                            <>
                              <div
                                style={{
                                  marginBottom: 4,
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                {ordenesResumen.length} orden(es)
                              </div>
                              {ordenesResumen
                                .slice(0, 4)
                                .map((o) => {
                                  const id =
                                    typeof o === "object"
                                      ? o.id_orden
                                      : o;
                                  return (
                                    <span
                                      key={id}
                                      style={{
                                        ...styles.chipOrd,
                                        cursor: "default",
                                      }}
                                    >
                                      #{id}
                                    </span>
                                  );
                                })}
                              {ordenesResumen.length > 4 ? (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#94a3b8",
                                    marginLeft: 4,
                                  }}
                                >
                                  +
                                  {ordenesResumen.length - 4}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                              }}
                            >
                              Sin órdenes
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            ...rowBase,
                            textAlign: "center",
                            position: "relative",
                          }}
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <button
                            type="button"
                            style={styles.menuBtn}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              if (menuEnvioOpenId === e.id_envio) {
                                setMenuEnvioOpenId(null);
                              } else {
                                const rect = ev.currentTarget.getBoundingClientRect();
                                setMenuEnvioOpenId(e.id_envio);
                                setMenuPosition({ top: rect.bottom, left: rect.left - 180 });
                              }
                            }}
                            title="Acciones"
                          >
                            <IconDots />
                          </button>

                          {/* 🚨 AQUÍ EL CAMBIO: createPortal */}
                          {menuEnvioOpenId === e.id_envio && createPortal(
                            <>
                              {/* 🚨 FONDO INVISIBLE PARA CERRAR */}
                              <div 
                                style={{ position: 'fixed', inset: 0, zIndex: 99998 }} 
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setMenuEnvioOpenId(null);
                                }}
                              />
                              {/* 🚨 MENÚ FLOTANTE */}
                              <div
                                style={{
                                  ...styles.menu,
                                  top: menuPosition.top,
                                  left: menuPosition.left,
                                }}
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <div
                                  style={{
                                    ...styles.menuItem,
                                    ...(caps.canEdit
                                      ? {}
                                      : styles.menuItemDisabled),
                                  }}
                                  onClick={() => {
                                    if (!caps.canEdit) return;
                                    setMenuEnvioOpenId(null);
                                    abrirEditarEnvio(e);
                                  }}
                                  title={
                                    caps.canEdit
                                      ? ""
                                      : caps.reasonFull
                                  }
                                >
                                  <span>Editar</span>
                                  {!caps.canEdit ? (
                                    <span
                                      style={styles.menuHint}
                                    >
                                      Bloqueado
                                    </span>
                                  ) : null}
                                </div>

                                <div
                                  style={{
                                    ...styles.menuItem,
                                    ...(caps.canAssign
                                      ? {}
                                      : styles.menuItemDisabled),
                                  }}
                                  onClick={() => {
                                    if (!caps.canAssign) return;
                                    setMenuEnvioOpenId(null);
                                    abrirAsignarOrdenes(e);
                                  }}
                                  title={
                                    caps.canAssign
                                      ? ""
                                      : caps.reasonFull
                                  }
                                >
                                  <span>Asignar órdenes</span>
                                  {!caps.canAssign ? (
                                    <span
                                      style={styles.menuHint}
                                    >
                                      Bloqueado
                                    </span>
                                  ) : null}
                                </div>

                                <div
                                  style={{
                                    ...styles.menuItem,
                                    ...(caps.canClose
                                      ? {}
                                      : styles.menuItemDisabled),
                                  }}
                                  onClick={() => {
                                    if (!caps.canClose) return;
                                    setMenuEnvioOpenId(null);
                                    cerrarEnvio(e);
                                  }}
                                  title={
                                    caps.canClose
                                      ? ""
                                      : caps.reasonFull
                                  }
                                >
                                  <span>Cerrar envío</span>
                                  {!caps.canClose ? (
                                    <span
                                      style={styles.menuHint}
                                    >
                                      Bloqueado
                                    </span>
                                  ) : null}
                                </div>

                                <div
                                  style={{
                                    ...styles.menuItem,
                                    borderBottom: "none",
                                    ...(caps.canDelete
                                      ? {}
                                      : styles.menuItemDisabled),
                                  }}
                                  title={
                                    caps.canDelete
                                      ? "Eliminar envío"
                                      : "Solo permitido en PENDIENTE POR ASIGNACIÓN"
                                  }
                                  onClick={() => {
                                    if (!caps.canDelete) return;
                                    setMenuEnvioOpenId(null);
                                    eliminarEnvio(e);
                                  }}
                                >
                                  <span>Eliminar</span>
                                  {!caps.canDelete ? (
                                    <span
                                      style={styles.menuHint}
                                    >
                                      Bloqueado
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </>,
                            document.body
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {enviosFiltrados.length ? (
              <div style={styles.resumenResultados}>
                Mostrando {enviosFiltrados.length} envío(s).
              </div>
            ) : null}

            {/* DETALLE ENVÍO */}
            {envioSeleccionado ? (
              <div
                ref={detalleEnvioRef}
                style={styles.detalleCard}
              >
                <div style={styles.detalleTitle}>
                  Envío {envioSeleccionado.codigo_envio}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    ID envío:
                  </span>{" "}
                  {envioSeleccionado.id_envio}
                </div>

                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Unidad:
                  </span>{" "}
                  <span
                    style={styles.linkPill}
                    onClick={() =>
                      abrirModalUnidadInfo(
                        envioSeleccionado.id_unidad
                      )
                    }
                    role="button"
                  >
                    {getUnidadLabel(
                      envioSeleccionado.id_unidad
                    )}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: -2,
                    marginBottom: 6,
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                  }}
                >
                  Tip: haz click en el nombre de la unidad para
                  ver su información.
                </div>

                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Transportista:
                  </span>{" "}
                  {(() => {
                    const u = getUnidadById(
                      envioSeleccionado.id_unidad
                    );
                    const idTrans = u?.id_usuario;
                    const label =
                      getTransportistaLabel(idTrans);
                    return idTrans ? (
                      <span
                        style={styles.linkPill}
                        role="button"
                        onClick={() =>
                          abrirModalTransportistaInfo(
                            idTrans
                          )
                        }
                      >
                        {label}
                      </span>
                    ) : (
                      label
                    );
                  })()}
                </div>
                <div
                  style={{
                    marginTop: -2,
                    marginBottom: 6,
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                  }}
                >
                  Tip: haz click en el nombre del transportista
                  para ver su información.
                </div>

                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Estado:
                  </span>{" "}
                  <span
                    style={styles.badgeEstadoEnvio(
                      envioSeleccionado.estado
                    )}
                  >
                    {String(
                      envioSeleccionado.estado || "N/A"
                    ).replace(/_/g, " ")}
                  </span>
                </div>

                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>
                    Fecha:
                  </span>{" "}
                  {formatFechaCorta(
                    envioSeleccionado.fecha_salida
                  )}
                </div>

                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    Capacidad del envío
                  </div>
                  {(() => {
                    const cap = getCapUnidad(
                      envioSeleccionado.id_unidad
                    );
                    const { sum, missing } =
                      getPesoEnvio(envioSeleccionado);
                    if (missing)
                      return (
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "#94a3b8",
                          }}
                        >
                          Peso total del envío:{" "}
                          <b>No disponible</b>
                        </div>
                      );
                    return renderCapBar(sum, cap);
                  })()}
                </div>

                <div
                  style={{
                    ...styles.detalleLine,
                    marginTop: 12,
                  }}
                >
                  <span style={styles.detalleLabel}>
                    Órdenes asignadas:
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    (click para ver detalle · si el envío está
                    pendiente, puedes quitar una orden)
                  </span>
                </div>

                <div style={{ marginTop: 6 }}>
                  {(() => {
                    const listado =
                      getOrdenesResumen(envioSeleccionado);
                    if (
                      !Array.isArray(listado) ||
                      listado.length === 0
                    )
                      return (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                          }}
                        >
                          Este envío aún no tiene órdenes.
                        </span>
                      );

                    const canQuickEdit =
                      normEstado(
                        envioSeleccionado.estado
                      ) === normEstado(ESTADO_CREACION_ENVIO);

                    return listado.map((o) => {
                      const id =
                        typeof o === "object"
                          ? o.id_orden
                          : o;
                      const cliente =
                        typeof o === "object"
                          ? o.cliente_nombre ||
                            o.id_cliente_nombre ||
                            "Cliente"
                          : "";
                      const estadoOrd =
                        typeof o === "object"
                          ? o.estado_de_envio || ""
                          : "";
                      const pesoOrd =
                        typeof o === "object"
                          ? getPesoFromObj(o)
                          : null;

                      return (
                        <div
                          key={id}
                          style={{
                            marginBottom: 8,
                            padding: "10px 10px",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "space-between",
                            gap: 10,
                          }}
                          onClick={() =>
                            abrirModalOrdenInfo(id)
                          }
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 900,
                                color: "#0d47a1",
                              }}
                            >
                              #{id}
                              {cliente
                                ? ` · ${cliente}`
                                : ""}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                marginTop: 2,
                              }}
                            >
                              {estadoOrd
                                ? `Estado: ${String(
                                    estadoOrd
                                  ).replace(/_/g, " ")}`
                                : ""}
                              {pesoOrd !== null
                                ? ` · Peso: ${toNumber(
                                    pesoOrd
                                  ).toFixed(2)} Kg`
                                : ""}
                            </div>
                          </div>

                          {canQuickEdit ? (
                            <button
                              type="button"
                              style={{
                                ...styles.buttonDanger,
                                height: 32,
                                padding: "0 10px",
                              }}
                              disabled={!!busyKey}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                quitarOrdenDeEnvio(
                                  envioSeleccionado,
                                  id
                                );
                              }}
                              title="Quitar orden del envío"
                            >
                              Quitar
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                              }}
                            >
                              Solo lectura
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Barra de acciones rápidas en tarjeta de detalle */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  {(() => {
                    const capsDetalle = envioActionCaps(
                      envioSeleccionado.estado
                    );
                    return (
                      <>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonGhost,
                            ...(capsDetalle.canEdit
                              ? {}
                              : styles.buttonDisabled),
                          }}
                          disabled={
                            !capsDetalle.canEdit || !!busyKey
                          }
                          onClick={() =>
                            capsDetalle.canEdit &&
                            abrirEditarEnvio(
                              envioSeleccionado
                            )
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonGhost,
                            ...(capsDetalle.canAssign
                              ? {}
                              : styles.buttonDisabled),
                          }}
                          disabled={
                            !capsDetalle.canAssign ||
                            !!busyKey
                          }
                          onClick={() =>
                            capsDetalle.canAssign &&
                            abrirAsignarOrdenes(
                              envioSeleccionado
                            )
                          }
                        >
                          Asignar órdenes
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonPrimary,
                            height: 32,
                            ...(capsDetalle.canClose
                              ? {}
                              : styles.buttonDisabled),
                          }}
                          disabled={
                            !capsDetalle.canClose ||
                            !!busyKey
                          }
                          onClick={() =>
                            capsDetalle.canClose &&
                            cerrarEnvio(envioSeleccionado)
                          }
                        >
                          Cerrar envío
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonDanger,
                            ...(capsDetalle.canDelete
                              ? {}
                              : styles.buttonDisabled),
                          }}
                          disabled={
                            !capsDetalle.canDelete ||
                            !!busyKey
                          }
                          onClick={() =>
                            capsDetalle.canDelete &&
                            eliminarEnvio(
                              envioSeleccionado
                            )
                          }
                        >
                          Eliminar
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : null}

            {loadingEnvios ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                Cargando envíos...
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ==================== MODALES ==================== */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        confirmTone={confirm.tone}
        confirmText="Confirmar"
        busy={!!busyKey && confirm.open}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm || (() => {})}
      >
        {confirm.text}
      </ConfirmModal>

      {/* MODAL UNIDAD (crear/editar) */}
      {showUnidadModal ? (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "560px" }}>
            <button
              type="button"
              style={styles.modalCloseX}
              onClick={() =>
                busyKey ? null : setShowUnidadModal(false)
              }
            >
              <IconX />
            </button>
            <h4 style={styles.modalTitle}>
              {unidadMode === "crear"
                ? "Registrar Unidad"
                : "Editar Unidad"}
            </h4>
            <div style={styles.modalSubtitle}>
              Completa los datos de la unidad y asigna un
              transportista. Todos los campos son obligatorios.
            </div>

            <form onSubmit={guardarUnidad}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>
                    Nombre de unidad *
                  </div>
                  <input
                    style={styles.input}
                    value={unidadForm.nombre_unidad}
                    onChange={(e) =>
                      setUnidadForm((p) => ({
                        ...p,
                        nombre_unidad: e.target.value.slice(
                          0,
                          15
                        ),
                      }))
                    }
                    placeholder="Ej: CAMION-01"
                    maxLength={15}
                    required
                  />
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                    }}
                  >
                    Máx 15 caracteres.
                  </div>
                </div>

                <div>
                  <div style={styles.label}>
                    Placa (6 a 10 caracteres) *
                  </div>
                  <input
                    style={styles.input}
                    value={unidadForm.placa}
                    onChange={(e) =>
                      setUnidadForm((p) => ({
                        ...p,
                        placa: e.target.value.slice(0, 10),
                      }))
                    }
                    placeholder="ABC-123"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <div style={styles.label}>Transportista *</div>
                  <select
                    style={styles.select}
                    value={unidadForm.id_usuario}
                    onChange={(e) =>
                      setUnidadForm((p) => ({
                        ...p,
                        id_usuario: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">
                      {loadingTransportistas
                        ? "Cargando..."
                        : "Selecciona..."}
                    </option>
                    {transportistas
                      .filter((t) => {
                        const id =
                          t.id_usuario ?? t.id;
                        return !transportistaOcupadoEnOtraUnidad(
                          id,
                          unidadMode === "editar" &&
                            unidadSeleccionada
                            ? unidadSeleccionada.id_unidad
                            : null
                        );
                      })
                      .map((t) => {
                        const id =
                          t.id_usuario ?? t.id;
                        return (
                          <option key={id} value={id}>
                            {t.username}
                          </option>
                        );
                      })}
                  </select>
                  {unidadForm.id_usuario ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      Teléfono del transportista:{" "}
                      <strong>
                        {getTransportistaTelefono(
                          unidadForm.id_usuario
                        ) || "No registrado"}
                      </strong>
                    </div>
                  ) : null}
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      style={{
                        ...styles.buttonGhost,
                        width: "100%",
                        justifyContent: "center",
                        height: 36,
                      }}
                      onClick={abrirNuevoTransportista}
                    >
                      + Nuevo Transportista
                    </button>
                  </div>
                </div>

                <div>
                  <div style={styles.label}>
                    Capacidad (Kg) *
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    style={styles.input}
                    value={unidadForm.capacidad_carga}
                    onChange={(e) =>
                      setUnidadForm((p) => ({
                        ...p,
                        capacidad_carga: e.target.value,
                      }))
                    }
                    placeholder="Ej: 5000"
                    required
                  />
                </div>

                <div>
                  <div style={styles.label}>Estado *</div>
                  <select
                    style={styles.select}
                    value={unidadForm.estado}
                    onChange={(e) =>
                      setUnidadForm((p) => ({
                        ...p,
                        estado: e.target.value,
                      }))
                    }
                    required
                  >
                    {UNIDAD_ESTADOS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {unidadFormError ? (
                <div style={styles.errorText}>
                  {unidadFormError}
                </div>
              ) : null}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  disabled={!!busyKey}
                  onClick={() => setShowUnidadModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.buttonPrimary,
                    ...(busyKey === "unidad:save"
                      ? styles.buttonDisabled
                      : {}),
                  }}
                  disabled={!!busyKey}
                >
                  {busyKey === "unidad:save"
                    ? "Guardando..."
                    : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL NUEVO TRANSPORTISTA */}
      {showTransportistaModal ? (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "560px" }}>
            <button
              type="button"
              style={styles.modalCloseX}
              onClick={() =>
                busyKey
                  ? null
                  : setShowTransportistaModal(false)
              }
            >
              <IconX />
            </button>
            <h4 style={styles.modalTitle}>
              Nuevo Transportista
            </h4>
            <div style={styles.modalSubtitle}>
              Crea un usuario para asignar a la unidad. Todos los
              campos son obligatorios.
            </div>

            <form onSubmit={guardarTransportista}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Usuario *</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.username}
                    onChange={(e) =>
                      setTransportistaForm((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <div style={styles.label}>Nombre *</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.first_name}
                    onChange={(e) =>
                      setTransportistaForm((p) => ({
                        ...p,
                        first_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <div style={styles.label}>Apellido *</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.last_name}
                    onChange={(e) =>
                      setTransportistaForm((p) => ({
                        ...p,
                        last_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <div style={styles.label}>Teléfono *</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.telefono}
                    onChange={(e) =>
                      setTransportistaForm((p) => ({
                        ...p,
                        telefono: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <div style={styles.label}>
                    Contraseña *
                  </div>
                  <input
                    type="password"
                    style={styles.input}
                    value={transportistaForm.password}
                    onChange={(e) =>
                      setTransportistaForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Ingresa una contraseña"
                    required
                  />
                </div>
              </div>

              {transportistaFormError ? (
                <div style={styles.errorText}>
                  {transportistaFormError}
                </div>
              ) : null}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  disabled={!!busyKey}
                  onClick={() =>
                    setShowTransportistaModal(false)
                  }
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.buttonPrimary,
                    ...(busyKey === "transportista:create"
                      ? styles.buttonDisabled
                      : {}),
                  }}
                  disabled={!!busyKey}
                >
                  {busyKey === "transportista:create"
                    ? "Creando..."
                    : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL ENVÍO */}
      {showEnvioModal ? (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "560px" }}>
            <button
              type="button"
              style={styles.modalCloseX}
              onClick={() =>
                busyKey ? null : setShowEnvioModal(false)
              }
            >
              <IconX />
            </button>
            <h4 style={styles.modalTitle}>
              {envioMode === "crear"
                ? "Nuevo Envío"
                : "Editar Envío"}
            </h4>
            <div style={styles.modalSubtitle}>
              Configura los datos del envío. Todos los campos son
              obligatorios.
            </div>

            <form onSubmit={guardarEnvio}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Código</div>
                  <input
                    style={{
                      ...styles.input,
                      backgroundColor: "#f1f5f9",
                    }}
                    value={
                      envioForm.codigo_envio ||
                      "Se generará automáticamente"
                    }
                    readOnly
                  />
                </div>

                <div>
                  <div style={styles.label}>
                    Unidad Asignada *
                  </div>
                  <select
                    style={styles.select}
                    value={envioForm.id_unidad}
                    onChange={(e) =>
                      setEnvioForm((p) => ({
                        ...p,
                        id_unidad: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">
                      Selecciona unidad...
                    </option>
                    {unidades
                      .filter((u) => {
                        const estadoNorm = normEstado(
                          u.estado
                        );
                        const esMismoEnvio =
                          envioMode === "editar" &&
                          envioSeleccionado &&
                          String(u.id_unidad) ===
                            String(
                              envioSeleccionado.id_unidad
                            );
                        const estadoPermitido =
                          estadoNorm === "ACTIVA" ||
                          estadoNorm === "DISPONIBLE" ||
                          esMismoEnvio;
                        if (!estadoPermitido) return false;
                        const tieneEnvioActivo =
                          envios.some(
                            (ev) =>
                              String(ev.id_unidad) ===
                                String(u.id_unidad) &&
                              !isFinalEnvioEstado(
                                ev.estado
                              ) &&
                              !(
                                envioMode === "editar" &&
                                envioSeleccionado &&
                                String(ev.id_envio) ===
                                  String(
                                    envioSeleccionado.id_envio
                                  )
                              )
                          );
                        return !tieneEnvioActivo;
                      })
                      .map((u) => (
                        <option
                          key={u.id_unidad}
                          value={u.id_unidad}
                        >
                          {u.codigo_unidad} · {u.placa || ""} ·
                          Cap:{" "}
                          {toNumber(
                            u.capacidad_carga
                          ).toFixed(2)}
                          Kg
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div style={styles.label}>
                    Fecha (salida) *
                  </div>
                  <input
                    type="date"
                    style={styles.input}
                    value={envioForm.fecha_salida}
                    min={todayISO()}
                    onChange={(e) =>
                      setEnvioForm((p) => ({
                        ...p,
                        fecha_salida: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {envioFormError ? (
                <div style={styles.errorText}>
                  {envioFormError}
                </div>
              ) : null}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  disabled={!!busyKey}
                  onClick={() => setShowEnvioModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.buttonPrimary,
                    ...(busyKey === "envio:save"
                      ? styles.buttonDisabled
                      : {}),
                  }}
                  disabled={!!busyKey}
                >
                  {busyKey === "envio:save"
                    ? "Guardando..."
                    : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL ASIGNAR */}
      {showAsignarModal ? (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "860px" }}>
            <button
              type="button"
              style={styles.modalCloseX}
              onClick={() =>
                busyKey ? null : setShowAsignarModal(false)
              }
            >
              <IconX />
            </button>
            <h4 style={styles.modalTitle}>Asignar Órdenes</h4>
            <div style={styles.modalSubtitle}>
              Envío:{" "}
              <strong>
                {envioSeleccionado?.codigo_envio}
              </strong>{" "}
              · Unidad:{" "}
              <strong>
                {getUnidadLabel(
                  envioSeleccionado?.id_unidad
                )}
              </strong>
            </div>

            {(() => {
              const cap = envioSeleccionado
                ? getCapUnidad(envioSeleccionado.id_unidad)
                : 0;
              return (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    Peso actual del envío + selección / Capacidad
                    de la unidad
                  </div>
                  {renderCapBar(pesoSeleccionado.sum, cap)}
                </div>
              );
            })()}

            <input
              style={styles.searchInput}
              placeholder="Filtrar orden por ID o cliente..."
              value={searchOrden}
              onChange={(e) =>
                setSearchOrden(e.target.value)
              }
            />

            <div
              style={{
                marginTop: 10,
                maxHeight: 340,
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                background: "#fff",
              }}
            >
              {ordenesDisponibles
                .filter((o) => {
                  const term = normalizeText(
                    searchOrden
                  );
                  if (!term) return true;
                  const cliente = (
                    o.cliente_nombre ||
                    o.id_cliente_nombre ||
                    ""
                  ).toLowerCase();
                  return (
                    String(o.id_orden).includes(term) ||
                    cliente.includes(term)
                  );
                })
                .map((o) => {
                  const peso = getPesoFromObj(o);
                  const cliente =
                    o.cliente_nombre ||
                    o.id_cliente_nombre ||
                    "Cliente";
                  return (
                    <label
                      key={o.id_orden}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={ordenesSeleccionadas.includes(
                          o.id_orden
                        )}
                        onChange={() =>
                          setOrdenesSeleccionadas(
                            (prev) =>
                              prev.includes(o.id_orden)
                                ? prev.filter(
                                    (id) =>
                                      id !== o.id_orden
                                  )
                                : [...prev, o.id_orden]
                          )
                        }
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            color: "#0d47a1",
                          }}
                        >
                          #{o.id_orden}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                          }}
                        >
                          {cliente} ·{" "}
                          {String(
                            o.estado_de_envio || ""
                          ).replace(/_/g, " ")}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "#94a3b8",
                          }}
                        >
                          Peso:{" "}
                          <b>
                            {peso === null
                              ? "—"
                              : `${toNumber(
                                  peso
                                ).toFixed(2)} Kg`}
                          </b>
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          ...styles.buttonGhost,
                          height: 32,
                        }}
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          abrirModalOrdenInfo(o.id_orden);
                        }}
                      >
                        Ver
                      </button>
                    </label>
                  );
                })}
              {ordenesDisponibles.length === 0 ? (
                <div
                  style={{
                    padding: 14,
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No hay órdenes disponibles.
                </div>
              ) : null}
            </div>

            {asignarError ? (
              <div style={styles.errorText}>
                {asignarError}
              </div>
            ) : null}

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.buttonGhost}
                disabled={!!busyKey}
                onClick={() => setShowAsignarModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{
                  ...styles.buttonPrimary,
                  ...(busyKey === "asignar:confirm"
                    ? styles.buttonDisabled
                    : {}),
                }}
                disabled={!!busyKey}
                onClick={confirmarAsignacion}
              >
                {busyKey === "asignar:confirm"
                  ? "Asignando..."
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL INFO UNIDAD */}
      <ModalShell
        open={showUnidadInfo}
        title={
          unidadInfo
            ? `Unidad: ${unidadInfo.codigo_unidad}`
            : "Unidad"
        }
        subtitle={
          unidadInfo
            ? `Placa: ${unidadInfo.placa || "-"}`
            : ""
        }
        onClose={() => setShowUnidadInfo(false)}
        maxWidth="640px"
      >
        {unidadInfo ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              color: "#334155",
            }}
          >
            <div>
              <b>Transportista:</b>{" "}
              {getTransportistaLabel(unidadInfo.id_usuario)}
            </div>
            <div>
              <b>Teléfono:</b>{" "}
              {unidadInfo.telefono ||
                getTransportistaTelefono(
                  unidadInfo.id_usuario
                ) ||
                "-"}
            </div>
            <div>
              <b>Capacidad:</b>{" "}
              {formatKg(
                toNumber(
                  unidadInfo.capacidad_carga || 0
                )
              )}
            </div>
            <div>
              <b>Estado:</b>{" "}
              <span
                style={styles.badgeEstadoUnidad(
                  unidadInfo.estado
                )}
              >
                {unidadInfo.estado || "N/A"}
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid #f1f5f9",
                color: "#64748b",
                fontSize: "0.85rem",
              }}
            >
              Tip: desde el detalle de un envío, haz click en la
              unidad o en el transportista para ver esta
              información.
            </div>
          </div>
        ) : (
          <div style={{ color: "#94a3b8" }}>
            No hay información.
          </div>
        )}
      </ModalShell>

      {/* MODAL INFO TRANSPORTISTA */}
      <ModalShell
        open={showTransportistaInfo}
        title={
          transportistaInfo
            ? `Transportista: ${
                `${transportistaInfo.first_name || ""} ${
                  transportistaInfo.last_name || ""
                }`.trim() || transportistaInfo.username
              }`
            : "Transportista"
        }
        subtitle={
          transportistaInfo
            ? `Usuario: ${
                transportistaInfo.username || "-"
              }`
            : ""
        }
        onClose={() => setShowTransportistaInfo(false)}
        maxWidth="540px"
      >
        {transportistaInfo ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              color: "#334155",
            }}
          >
            <div>
              <b>Nombre:</b>{" "}
              {`${transportistaInfo.first_name || ""} ${
                transportistaInfo.last_name || ""
              }`.trim() || transportistaInfo.username}
            </div>
            <div>
              <b>Usuario:</b>{" "}
              {transportistaInfo.username || "-"}
            </div>
            <div>
              <b>Teléfono:</b>{" "}
              {transportistaInfo.telefono || "-"}
            </div>
            <div>
              <b>Tipo:</b>{" "}
              {transportistaInfo.tipo || "TRANSPORTISTA"}
            </div>
            {transportistaInfo.email ||
            transportistaInfo.correo ? (
              <div>
                <b>Correo:</b>{" "}
                {transportistaInfo.email ||
                  transportistaInfo.correo}
              </div>
            ) : null}
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid #f1f5f9",
                color: "#64748b",
                fontSize: "0.85rem",
              }}
            >
              Información general del transportista asignado a la
              unidad / envío.
            </div>
          </div>
        ) : (
          <div style={{ color: "#94a3b8" }}>
            No hay información.
          </div>
        )}
      </ModalShell>

      {/* MODAL INFO ORDEN */}
      <ModalShell
        open={showOrdenInfo}
        title={
          ordenInfo.orden
            ? `Orden #${ordenInfo.orden.id_orden || ""}`
            : "Orden"
        }
        subtitle={
          ordenInfo.orden
            ? `Cliente: ${
                ordenInfo.orden.id_cliente_nombre ||
                ordenInfo.orden.cliente_nombre ||
                ordenInfo.cliente?.nombre ||
                "-"
              }`
            : ""
        }
        onClose={() => setShowOrdenInfo(false)}
        maxWidth="820px"
      >
        {ordenInfo.loading ? (
          <div
            style={{
              padding: 14,
              color: "#64748b",
            }}
          >
            Cargando orden...
          </div>
        ) : ordenInfo.error ? (
          <div style={styles.errorText}>
            {ordenInfo.error}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "grid",
                gap: 6,
                color: "#334155",
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                Datos de la orden
              </div>
              <div>
                <b>Estado envío:</b>{" "}
                {String(
                  ordenInfo.orden?.estado_de_envio || "-"
                ).replace(/_/g, " ")}
              </div>
              <div>
                <b>Fecha:</b>{" "}
                {formatFechaCorta(
                  ordenInfo.orden?.fecha_orden
                )}
              </div>
              <div>
                <b>Total:</b>{" "}
                $ {ordenInfo.orden?.precio_final ?? "-"}
              </div>
              <div>
                <b>Peso total:</b>{" "}
                {ordenInfo.peso === null
                  ? "No disponible"
                  : formatKg(ordenInfo.peso)}
              </div>
              <div>
                <b>Método de pago:</b>{" "}
                {ordenInfo.orden?.metodo_pago || "-"}
              </div>

              {ordenInfo.cliente ? (
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 8,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    Datos del cliente
                  </div>
                  <div>
                    <b>Nombre:</b>{" "}
                    {ordenInfo.cliente.nombre || "-"}
                  </div>
                  <div>
                    <b>RIF / Cédula:</b>{" "}
                    {ordenInfo.cliente.rif_cedula ||
                      ordenInfo.orden?.rif_cedula ||
                      "-"}
                  </div>
                  <div>
                    <b>Teléfono:</b>{" "}
                    {ordenInfo.cliente.telefono || "-"}
                  </div>
                  <div>
                    <b>Correo:</b>{" "}
                    {ordenInfo.cliente.correo || "-"}
                  </div>
                  <div>
                    <b>Dirección:</b>{" "}
                    {ordenInfo.cliente.direccion || "-"}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                marginTop: 14,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Items
            </div>
            <div
              style={{
                marginTop: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        background: "#f8fafc",
                        padding: 10,
                        textAlign: "left",
                        color: "#475569",
                        fontWeight: 900,
                      }}
                    >
                      Producto
                    </th>
                    <th
                      style={{
                        background: "#f8fafc",
                        padding: 10,
                        textAlign: "left",
                        color: "#475569",
                        fontWeight: 900,
                      }}
                    >
                      Cant.
                    </th>
                    <th
                      style={{
                        background: "#f8fafc",
                        padding: 10,
                        textAlign: "right",
                        color: "#475569",
                        fontWeight: 900,
                      }}
                    >
                      Subtotal
                    </th>
                    <th
                      style={{
                        background: "#f8fafc",
                        padding: 10,
                        textAlign: "right",
                        color: "#475569",
                        fontWeight: 900,
                      }}
                    >
                      Peso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(ordenInfo.detalles || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: 12,
                          color: "#94a3b8",
                        }}
                      >
                        Sin detalles.
                      </td>
                    </tr>
                  ) : (
                    (ordenInfo.detalles || []).map(
                      (d, idx) => (
                        <tr key={idx}>
                          <td
                            style={{
                              padding: 10,
                              borderTop:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {d.id_producto_nombre ||
                              d.producto ||
                              d.id_producto?.nombre ||
                              "Producto"}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderTop:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {d.cantidad}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderTop:
                                "1px solid #f1f5f9",
                              textAlign: "right",
                              fontWeight: 800,
                            }}
                          >
                            {d.subtotal}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderTop:
                                "1px solid #f1f5f9",
                              textAlign: "right",
                              fontWeight: 800,
                            }}
                          >
                            {d.peso_subtotal ?? "-"}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {(() => {
              const notas = (ordenInfo.detalles || [])
                .map((d) => d.nota)
                .filter((n) => !!n);
              if (!notas.length) return null;
              return (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    Notas
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: "#334155",
                    }}
                  >
                    {notas.slice(0, 8).map((n, i) => (
                      <li
                        key={i}
                        style={{ marginBottom: 4 }}
                      >
                        {String(n)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}
      </ModalShell>
    </div>
  );
}