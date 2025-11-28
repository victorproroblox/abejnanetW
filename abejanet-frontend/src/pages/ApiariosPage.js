// src/pages/ApiariosPage.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./DashboardPage.css";   // layout general (topbar, drawer, fondo)
import "./ApiariosPage.css";    // estilos específicos de apiarios
import logo from "../assets/abeja_logo.png";

/* ====== Iconos menú ====== */
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

/* ====== Página Apiarios ====== */
export default function ApiariosPage() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const email = usuario?.correo_electronico || "Invitado";
  const initials = (email || "U").slice(0, 2).toUpperCase();

  const navItems = [
    { to: "/dashboard", label: "🏠 Inicio" },
    { to: "/apiarios", label: "🏷️ Apiarios" },
    { to: "/colmenas", label: "🐝 Colmenas" },
    { to: "/reportes", label: "📄 Reportes" },
    { to: "/sensores", label: "🛠 Sensores" },
    { to: "/cuenta", label: "👤 Cuenta" },
  ];

  // Datos de apiarios
  const [apiarios, setApiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // apiario o null
  const [form, setForm] = useState({
    nombre: "",
    ubicacion: "",
    descripcion: "",
  });

  // Cargar lista (por ahora solo GET; luego conectamos POST/PUT/DELETE)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await fetch(
          "https://abejanet-backend-cplf.onrender.com/api/apiarios"
        );
        const data = await res.json();
        setApiarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErrorMsg("No se pudieron cargar los apiarios.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ nombre: "", ubicacion: "", descripcion: "" });
    setModalOpen(true);
  };

  const openEditModal = (apiario) => {
    setEditing(apiario);
    setForm({
      nombre: apiario.nombre || "",
      ubicacion: apiario.ubicacion || "",
      descripcion: apiario.descripcion || apiario.descripcion_especifica || "",
    });
    setModalOpen(true);
  };

  const handleDeleteLocal = (id) => {
    if (!window.confirm("¿Eliminar este apiario?")) return;
    // TODO: aquí después conectamos DELETE al backend
    setApiarios((prev) => prev.filter((a) => a.id !== id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    // TODO: después conectamos POST/PUT al backend.
    // Por ahora solo actualizamos el estado local para que la UI sea funcional.
    if (editing) {
      setApiarios((prev) =>
        prev.map((a) =>
          a.id === editing.id ? { ...a, ...form } : a
        )
      );
    } else {
      const tempId = Date.now();
      setApiarios((prev) => [...prev, { id: tempId, ...form }]);
    }

    setModalOpen(false);
    setEditing(null);
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
                onClick={() => setOpen(false)}
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

      <button
        className="overlay"
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
      />

      {/* CONTENIDO */}
      <main className="content">
        <div className="apiarios-page">
          <div className="apiarios-head">
            <div>
              <h1>Apiarios</h1>
              <p>Gestiona tus apiarios y su ubicación.</p>
            </div>
            <button className="apiario-btn-primary" onClick={openCreateModal}>
              ➕ Nuevo apiario
            </button>
          </div>

          {loading && <div className="apiarios-note">Cargando apiarios…</div>}
          {errorMsg && (
            <div className="apiarios-alert error">
              <p>{errorMsg}</p>
            </div>
          )}

          {!loading && !apiarios.length && !errorMsg && (
            <div className="apiarios-empty">
              <h3>No hay apiarios registrados</h3>
              <p>Comienza agregando tu primer apiario.</p>
            </div>
          )}

          {!!apiarios.length && (
            <div className="apiarios-grid">
              {apiarios.map((a) => (
                <article key={a.id} className="apiario-card">
                  <header className="apiario-card-head">
                    <h3>{a.nombre}</h3>
                    <span className="apiario-tag">
                      #{a.id}
                    </span>
                  </header>
                  <p className="apiario-sub">
                    {a.ubicacion || a.ubicacion_referencial || "Ubicación no especificada"}
                  </p>
                  <p className="apiario-desc">
                    {a.descripcion ||
                      a.descripcion_especifica ||
                      "Sin descripción registrada."}
                  </p>

                  <footer className="apiario-card-actions">
                    <button
                      type="button"
                      className="apiario-btn-secondary"
                      onClick={() => openEditModal(a)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="apiario-btn-danger"
                      onClick={() => handleDeleteLocal(a.id)}
                    >
                      Eliminar
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL CREAR/EDITAR */}
      {modalOpen && (
        <>
          <div
            className="apiario-modal-backdrop"
            onClick={() => setModalOpen(false)}
          />
          <div className="apiario-modal" role="dialog" aria-modal="true">
            <h2>{editing ? "Editar apiario" : "Nuevo apiario"}</h2>
            <form onSubmit={handleSubmit} className="apiario-form">
              <label>
                <span>Nombre *</span>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Apiario Principal"
                />
              </label>

              <label>
                <span>Ubicación</span>
                <input
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  placeholder="Referencia, localidad, coordenadas…"
                />
              </label>

              <label>
                <span>Descripción</span>
                <textarea
                  name="descripcion"
                  rows={3}
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Notas relevantes de este apiario…"
                />
              </label>

              <div className="apiario-form-actions">
                <button
                  type="button"
                  className="apiario-btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="apiario-btn-primary"
                >
                  {editing ? "Guardar cambios" : "Crear apiario"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
