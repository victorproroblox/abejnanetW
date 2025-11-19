
// src/pages/ColmenasPage.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import "./ColmenasPage.css";
import logo from "../assets/abeja_logo.png";

/* ICONOS MENÚ */
function BeeIcon(props) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 8.5c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 6l3 3M18 6l-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 4v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 13h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 18.5C9 20 10.5 20.5 12 20.5s3-.5 4.5-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CloseIcon(props) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* SUBCOMPONENTES */
function StatChip({ label, value }) {
  return (
    <div className="stat-chip">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-colmena skeleton">
      <div className="sk-line sk-title" />
      <div className="sk-line sk-desc" />
      <div className="sk-line sk-desc short" />
      <div className="sk-badge" />
    </div>
  );
}

/* PÁGINA */
export default function ColmenasPage() {
  const [open, setOpen] = useState(false); // drawer
  const location = useLocation();

  const [colmenas, setColmenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [errorDelete, setErrorDelete] = useState("");

  // Controles
  const [q, setQ] = useState("");
  const [apiario, setApiario] = useState("todos");
  const [sort, setSort] = useState("nombre_asc");

  // Usuario chip
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const email = usuario?.correo_electronico || "Invitado";
  const initials = (email || "U").slice(0, 2).toUpperCase();

  const navItems = [
    { to: "/dashboard", label: "🏠 Inicio" },
    { to: "/colmenas", label: "🐝 Colmenas" },
    { to: "/reportes", label: "📄 Reportes" },
    { to: "/sensores", label: "🛠 Sensores" },
    { to: "/cuenta", label: "👤 Cuenta" },
  ];

  useEffect(() => {
    const cargarColmenas = async () => {
      try {
        setLoading(true);
        const res = await axios.get("https://abejanet-backend-cplf.onrender.com/api/colmenas");
        setColmenas(res.data || []);
      } catch (error) {
        console.error("Error al cargar colmenas:", error);
        setFail(true);
      } finally {
        setLoading(false);
      }
    };
    cargarColmenas();
  }, []);

  const apiarios = useMemo(() => {
    const set = new Set();
    colmenas.forEach((c) => c.apiario && set.add(c.apiario));
    return ["todos", ...Array.from(set)];
  }, [colmenas]);

  const filtered = useMemo(() => {
    let rows = [...colmenas];

    // búsqueda
    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter((c) => {
        const n = (c.nombre || "").toLowerCase();
        const d = (c.descripcion_especifica || "").toLowerCase();
        const a = (c.apiario || "").toLowerCase();
        return n.includes(needle) || d.includes(needle) || a.includes(needle);
      });
    }

    // filtro apiario
    if (apiario !== "todos") {
      rows = rows.filter((c) => (c.apiario || "") === apiario);
    }

    // orden
    const compareStr = (a, b) =>
      (a || "")
        .toString()
        .localeCompare((b || "").toString(), "es", { sensitivity: "base" });

    switch (sort) {
      case "nombre_asc":
        rows.sort((a, b) => compareStr(a.nombre, b.nombre));
        break;
      case "nombre_desc":
        rows.sort((a, b) => compareStr(b.nombre, a.nombre));
        break;
      case "apiario_asc":
        rows.sort((a, b) => compareStr(a.apiario, b.apiario));
        break;
      case "apiario_desc":
        rows.sort((a, b) => compareStr(b.apiario, a.apiario));
        break;
      default:
        break;
    }

    return rows;
  }, [colmenas, q, apiario, sort]);

  const closeOnRoute = () => setOpen(false);

  /* Eliminar colmena */
  const handleDelete = async (id, nombre) => {
    setErrorDelete("");
    const ok = window.confirm(
      `¿Eliminar la colmena "${nombre}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    const prev = colmenas;
    setDeletingId(id);
    setColmenas((xs) => xs.filter((c) => c.id !== id));

    try {
      const res = await axios.delete(
        `https://abejanet-backend-cplf.onrender.com/api/colmenas/${id}`
      );
      if (res.status !== 200) throw new Error("No se pudo eliminar");
    } catch (e) {
      setColmenas(prev);
      setErrorDelete(
        e?.response?.data?.error || e.message || "Error al eliminar"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`dash-root ${open ? "drawer-open" : ""}`}>
      {/* TOPBAR */}
      <header className="topbar">
        <button
          className="icon-btn"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <CloseIcon /> : <BeeIcon />}
        </button>

        <div className="brand">
          <img src={logo} alt="AbejaNet" />
          <span className="brand-name">AbejaNet</span>
        </div>

        <div className="user-chip" title={email}>
          <span className="user-initials">{initials}</span>
          <span className="user-mail">{email}</span>
        </div>
      </header>

      {/* DRAWER */}
      <aside className="drawer" role="navigation" aria-label="Menú principal">
        <div className="drawer-head">
          <img src={logo} alt="AbejaNet" />
          <strong>AbejaNet</strong>
        </div>
        <ul className="drawer-links">
          {navItems.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={location.pathname === to ? "active" : ""}
                onClick={closeOnRoute}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="drawer-footer">
          <small>{email}</small>
        </div>
      </aside>

      {/* overlay */}
      <button
        className="overlay"
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
      />

      {/* CONTENIDO */}
      <main className="content">
        <div className="colmenas-container">
          <div className="page-head">
            <h2 className="titulo">🐝 Colmenas registradas</h2>

            <div className="actions-row">
              <div className="stats-row">
                <StatChip label="Total" value={colmenas.length} />
                <StatChip label="Mostrando" value={filtered.length} />
                <StatChip
                  label="Apiarios"
                  value={apiarios.filter((a) => a !== "todos").length}
                />
              </div>

              <Link to="/colmenas/crear" className="btn-primary">
                ➕ Crear colmena
              </Link>
            </div>
          </div>

          {errorDelete && (
            <div className="empty-box error" style={{ marginBottom: 12 }}>
              <h3>⚠️ No se pudo eliminar</h3>
              <p>{errorDelete}</p>
            </div>
          )}

          {/* Controles */}
          <div className="toolbar">
            <div className="input-wrap">
              <input
                className="input"
                type="text"
                placeholder="Buscar por nombre, apiario o descripción…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <span className="kbd">/</span>
            </div>

            <div className="selects">
              <label className="select">
                <span>Apiario</span>
                <select
                  value={apiario}
                  onChange={(e) => setApiario(e.target.value)}
                >
                  {apiarios.map((a) => (
                    <option key={a} value={a}>
                      {a === "todos" ? "Todos" : a}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select">
                <span>Orden</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="nombre_asc">Nombre (A→Z)</option>
                  <option value="nombre_desc">Nombre (Z→A)</option>
                  <option value="apiario_asc">Apiario (A→Z)</option>
                  <option value="apiario_desc">Apiario (Z→A)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Estados */}
          {loading ? (
            <div className="grid-colmenas">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : fail ? (
            <div className="empty-box error">
              <h3>😕 No se pudieron cargar las colmenas</h3>
              <p>
                Verifica tu API en{" "}
                <code>https://abejanet-backend-cplf.onrender.com/api/colmenas</code>.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-box">
              <h3>Sin resultados</h3>
              <p>
                Intenta limpiar filtros o busca por otro término. <br />
                Tip: presiona la tecla <kbd>/</kbd> para enfocar el buscador.
              </p>
            </div>
          ) : (
            <div className="grid-colmenas">
              {filtered.map((colmena) => (
                <div key={colmena.id} className="card-colmena">
                  <div className="card-head">
                    <h3 className="colmena-nombre">{colmena.nombre}</h3>
                    <span className="badge-apiario" title="Apiario">
                      📍 {colmena.apiario || "—"}
                    </span>
                  </div>

                  <p className="colmena-desc">
                    {colmena.descripcion_especifica || "Sin descripción"}
                  </p>

                  <div className="card-foot">
                    <Link to={`/colmena/${colmena.id}`} className="pill">
                      Ver detalle
                    </Link>
                    <Link
                      to={`/colmenas/editar/${colmena.id}`}
                      className="pill edit"
                    >
                      ✏️ Editar
                    </Link>
                    <button
                      className="pill danger"
                      onClick={() =>
                        handleDelete(colmena.id, colmena.nombre)
                      }
                      disabled={deletingId === colmena.id}
                      title="Eliminar colmena"
                    >
                      {deletingId === colmena.id
                        ? "Eliminando…"
                        : "🗑️ Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
