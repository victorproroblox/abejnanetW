import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sensores.css";   // Reutilizamos TODO el mismo estilo
import "./ApiariosPage.css";   // El tuyo propio

export default function Apiarios() {
  const navigate = useNavigate();

  const [apiarios, setApiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: "",
    direccion_o_coordenadas: "",
    descripcion_general: "",
  });

  /* ============================
        CARGAR APIARIOS
  ============================ */
  const cargarApiarios = () => {
    setLoading(true);
    fetch("https://abejanet-backend-cplf.onrender.com/api/apiarios")
      .then((res) => res.json())
      .then((data) => setApiarios(data))
      .catch((err) => console.error("Error al cargar apiarios:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarApiarios();
  }, []);

  /* ============================
        FORMULARIO HANDLERS
  ============================ */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion_o_coordenadas: "",
      descripcion_general: "",
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `https://abejanet-backend-cplf.onrender.com/api/apiarios/${editing}`
      : "https://abejanet-backend-cplf.onrender.com/api/apiarios";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al guardar el apiario.");
        }
        return res.json();
      })
      .then(() => {
        cargarApiarios();
        resetForm();
      })
      .catch((err) => alert(err.message));
  };

  const handleEdit = (a) => {
    setEditing(a.id);
    setFormData({
      nombre: a.nombre || "",
      direccion_o_coordenadas: a.direccion_o_coordenadas || "",
      descripcion_general: a.descripcion_general || "",
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Eliminar apiario?")) return;

    fetch(`https://abejanet-backend-cplf.onrender.com/api/apiarios/${id}`, {
      method: "DELETE",
    })
      .then(() => cargarApiarios())
      .catch((err) => console.error("Error al eliminar apiario:", err));
  };

  /* ============================
        RENDER
  ============================ */
  return (
    <div className="sensores-layout">

      {/* == SIDEBAR EXACTAMENTE IGUAL QUE SENSORES == */}
      <aside className="sensores-sidebar">
        <div className="sensores-logo" onClick={() => navigate("/dashboard")}>
          <span className="sensores-logo-icon">🐝</span>
          <span className="sensores-logo-text">AbejaNet</span>
        </div>

        <nav className="sensores-nav">
          <button className="sensores-nav-item" onClick={() => navigate("/dashboard")}>
            <span>🏠</span> <span>Inicio</span>
          </button>

          <button className="sensores-nav-item sensores-nav-item-active" onClick={() => navigate("/apiarios")}>
            <span>🏷️</span> <span>Apiarios</span>
          </button>

          <button className="sensores-nav-item" onClick={() => navigate("/colmenas")}>
            <span>🍯</span> <span>Colmenas</span>
          </button>

          <button className="sensores-nav-item" onClick={() => navigate("/sensores")}>
            <span>📡</span> <span>Sensores</span>
          </button>

          <button className="sensores-nav-item" onClick={() => navigate("/usuarios")}>
            <span>👥</span> <span>Usuarios</span>
          </button>

          <button className="sensores-nav-item" onClick={() => navigate("/cuenta")}>
            <span>👤</span> <span>Cuenta</span>
          </button>
        </nav>
      </aside>

      {/* == CONTENIDO PRINCIPAL == */}
      <main className="sensores-main">

        <header className="sensores-header">
          <div>
            <p className="sensores-badge">Panel de control</p>
            <h1>Gestión de Apiarios</h1>
            <p className="sensores-subtitle">
              Administra los apiarios, su ubicación y descripción general.
            </p>
          </div>

          <div className="sensores-header-resumen">
            <span className="sensores-resumen-pill">
              Total: <strong>{apiarios.length}</strong>
            </span>
          </div>
        </header>

        {/* FORMULARIO */}
        <section className="sensores-card">
          <form className="form-sensor" onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre del Apiario"
              value={formData.nombre}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="direccion_o_coordenadas"
              placeholder="Dirección o Coordenadas"
              value={formData.direccion_o_coordenadas}
              onChange={handleChange}
            />

            <textarea
              name="descripcion_general"
              placeholder="Descripción General"
              value={formData.descripcion_general}
              onChange={handleChange}
            />

            <div className="form-sensor-actions">
              <button type="submit" className="btn-primario">
                {editing ? "Actualizar Apiario" : "Agregar Apiario"}
              </button>
              {editing && (
                <button type="button" className="btn-secundario" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* TABLA */}
        <section className="sensores-card">
          {loading ? (
            <div className="cuenta-loading">Cargando apiarios...</div>
          ) : apiarios.length === 0 ? (
            <p className="sensores-empty">No hay apiarios registrados.</p>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-sensores">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección / Coordenadas</th>
                    <th>Descripción</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {apiarios.map((a) => (
                    <tr key={a.id}>
                      <td>{a.nombre}</td>
                      <td>{a.direccion_o_coordenadas || "N/A"}</td>
                      <td>{a.descripcion_general || "Sin descripción"}</td>
                      <td>
                        {a.fecha_creacion
                          ? new Date(a.fecha_creacion).toLocaleDateString("es-MX")
                          : "N/A"}
                      </td>

                      <td className="tabla-sensores-actions">
                        <button className="editar" onClick={() => handleEdit(a)}>
                          ✏️
                        </button>
                        <button className="eliminar" onClick={() => handleDelete(a.id)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
