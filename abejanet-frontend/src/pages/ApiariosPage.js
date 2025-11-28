import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ApiariosPage.css"; // Estilos específicos

export default function ApiariosPage() {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [apiarios, setApiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // ID del apiario en edición

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("");

  // Formulario (adaptado a tu tabla apiarios)
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",   // Se guardará en 'direccion_o_coordenadas'
    descripcion: "", // Se guardará en 'descripcion_general'
  });

  // --- API URL (Localhost) ---
  const API_URL = "http://localhost:4000/api/apiarios";

  // --- CARGAR DATOS ---
  const cargarApiarios = () => {
    // Construimos query string para filtros
    const params = new URLSearchParams();
    if (filtroNombre) params.append("buscar", filtroNombre);
    const queryString = params.toString();

    setLoading(true);
    fetch(`${API_URL}?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setApiarios(data);
        } else {
          setApiarios([]);
        }
      })
      .catch((err) => {
        console.error("Error al cargar apiarios:", err);
        setApiarios([]);
      })
      .finally(() => setLoading(false));
  };

  // Efecto para cargar al inicio y cuando cambia el filtro
  useEffect(() => {
    cargarApiarios();
  }, [filtroNombre]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      ubicacion: "",
      descripcion: "",
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API_URL}/${editing}` : API_URL;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Error ${res.status}: No se pudo completar la operación`
          );
        }
        return res.json();
      })
      .then(() => {
        cargarApiarios();
        resetForm();
        // alert(editing ? "Apiario actualizado" : "Apiario creado");
      })
      .catch((err) => {
        console.error("Error al guardar apiario:", err.message);
        alert(err.message);
      });
  };

  const handleEdit = (apiario) => {
    setEditing(apiario.id);
    setFormData({
      nombre: apiario.nombre || "",
      // Mapeamos los nombres de la BD a los del form
      ubicacion: apiario.direccion_o_coordenadas || "", 
      descripcion: apiario.descripcion_general || "",
    });
    // Scroll arriba para ver el form
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este apiario?")) {
      fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => cargarApiarios())
        .catch((err) => console.error("Error al eliminar apiario:", err));
    }
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
  };

  // --- RENDER ---
  return (
    <div className="apiarios-layout">
      
      {/* ==== SIDEBAR MANUAL (Igual a Sensores) ==== */}
      <aside className="apiarios-sidebar">
        <div className="apiarios-logo" onClick={() => navigate("/dashboard")}>
          <span className="apiarios-logo-icon">🐝</span>
          <span className="apiarios-logo-text">AbejaNet</span>
        </div>

        <nav className="apiarios-nav">
          <button className="apiarios-nav-item" onClick={() => navigate("/dashboard")}>
            <span>🏠</span> <span>Inicio</span>
          </button>
          
          {/* Botón activo */}
          <button className="apiarios-nav-item apiarios-nav-item-active" onClick={() => navigate("/apiarios")}>
            <span>🏷️</span> <span>Apiarios</span>
          </button>

          <button className="apiarios-nav-item" onClick={() => navigate("/colmenas")}>
            <span>🍯</span> <span>Colmenas</span>
          </button>
          <button className="apiarios-nav-item" onClick={() => navigate("/reportes")}>
            <span>📊</span> <span>Reportes</span>
          </button>
          <button className="apiarios-nav-item" onClick={() => navigate("/sensores")}>
            <span>📡</span> <span>Sensores</span>
          </button>
          <button className="apiarios-nav-item" onClick={() => navigate("/usuarios")}>
            <span>👥</span> <span>Usuarios</span>
          </button>
          <button className="apiarios-nav-item" onClick={() => navigate("/cuenta")}>
            <span>👤</span> <span>Cuenta</span>
          </button>
        </nav>
      </aside>

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="apiarios-main">
        
        <header className="apiarios-header">
          <div>
            <p className="apiarios-badge">Gestión de Ubicaciones</p>
            <h1>Mis Apiarios</h1>
            <p className="apiarios-subtitle">
              Registra y administra las ubicaciones de tus colmenas.
            </p>
          </div>
          <div className="apiarios-header-resumen">
            <span className="apiarios-resumen-pill">
              Total: <strong>{apiarios.length}</strong>
            </span>
          </div>
        </header>

        {/* TARJETA DE FILTROS + FORMULARIO */}
        <section className="apiarios-card">
          
          {/* Filtros */}
          <div className="form-apiario-filtros">
            <input
              type="text"
              name="filtro_nombre"
              placeholder="Buscar por nombre..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
            <button
              type="button"
              className="btn-secundario"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          </div>

          {/* Formulario */}
          <form className="form-apiario" onSubmit={handleSubmit}>
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
              name="ubicacion"
              placeholder="Ubicación / Coordenadas"
              value={formData.ubicacion}
              onChange={handleChange}
            />

            <input
              type="text"
              name="descripcion"
              placeholder="Descripción general"
              value={formData.descripcion}
              onChange={handleChange}
              style={{ flexGrow: 2 }} // Para que ocupe más espacio si hay hueco
            />

            <div className="form-apiario-actions">
              <button type="submit" className="btn-primario">
                {editing ? "Actualizar Apiario" : "Agregar Apiario"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* TABLA DE APIARIOS */}
        <section className="apiarios-card">
          {loading ? (
            <div className="cuenta-loading">Cargando apiarios...</div>
          ) : apiarios.length === 0 ? (
            <p className="apiarios-empty">
              No hay apiarios registrados que coincidan con la búsqueda.
            </p>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-apiarios">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ubicación</th>
                    <th>Descripción</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {apiarios.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.nombre}</strong></td>
                      <td>{item.direccion_o_coordenadas || "—"}</td>
                      <td>{item.descripcion_general || "—"}</td>
                      <td>
                        {item.fecha_creacion
                          ? new Date(item.fecha_creacion).toLocaleDateString("es-MX")
                          : "—"}
                      </td>
                      <td className="tabla-apiarios-actions">
                        <button
                          className="editar"
                          onClick={() => handleEdit(item)}
                        >
                          ✏️
                        </button>
                        <button
                          className="eliminar"
                          onClick={() => handleDelete(item.id)}
                        >
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
