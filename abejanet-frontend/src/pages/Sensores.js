import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sensores.css";

export default function Sensores() {
  const navigate = useNavigate();
  const [sensores, setSensores] = useState([]);
  const [colmenas, setColmenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Filtros
  const [filtroColmena, setFiltroColmena] = useState("");
  const [filtroMac, setFiltroMac] = useState("");

  const estadosDisponibles = ["activo", "inactivo", "mantenimiento", "no_asignado"];

  const [formData, setFormData] = useState({
    colmena_id: "",
    tipo_sensor: "",
    estado: "",
    fecha_instalacion: "",
    mac_address: "",
  });

  // Cargar sensores (usa filtros)
  const cargarSensores = () => {
    const params = new URLSearchParams();
    if (filtroColmena) params.append("colmena", filtroColmena);
    if (filtroMac) params.append("mac", filtroMac);
    const queryString = params.toString();

    setLoading(true);
    return fetch(`https://abejanet-backend-cplf.onrender.com/api/sensores?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        setSensores(data);
      })
      .catch((err) => {
        console.error("Error al cargar sensores:", err);
        throw err;
      })
      .finally(() => setLoading(false));
  };

  // Cargar colmenas
  const cargarColmenas = () => {
    return fetch("https://abejanet-backend-cplf.onrender.com/api/colmenas")
      .then((res) => res.json())
      .then((data) => setColmenas(data))
      .catch((err) => {
        console.error("Error al cargar colmenas:", err);
        throw err;
      });
  };

  // Colmenas solo una vez
  useEffect(() => {
    cargarColmenas();
  }, []);

  // Sensores cada vez que cambian filtros
  useEffect(() => {
    cargarSensores();
  }, [filtroColmena, filtroMac]);

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      colmena_id: "",
      tipo_sensor: "",
      estado: "",
      fecha_instalacion: "",
      mac_address: "",
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `https://abejanet-backend-cplf.onrender.com/api/sensores/${editing}`
      : "https://abejanet-backend-cplf.onrender.com/api/sensores";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Error ${res.status}: No se pudo completar la operación`
          );
        }
        return res.json();
      })
      .then(() => {
        cargarSensores();
        resetForm();
      })
      .catch((err) => {
        console.error("Error al guardar sensor:", err.message);
        alert(err.message);
      });
  };

  const handleEdit = (sensor) => {
    setEditing(sensor.id);
    setFormData({
      colmena_id: sensor.colmena_id || "",
      tipo_sensor: sensor.tipo_sensor || "",
      estado: sensor.estado || "",
      fecha_instalacion: sensor.fecha_instalacion
        ? sensor.fecha_instalacion.split("T")[0]
        : "",
      mac_address: sensor.mac_address || "",
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este sensor?")) {
      fetch(`https://abejanet-backend-cplf.onrender.com/api/sensores/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => cargarSensores())
        .catch((err) => console.error("Error al eliminar sensor:", err));
    }
  };

  const limpiarFiltros = () => {
    setFiltroColmena("");
    setFiltroMac("");
  };

  return (
    <div className="sensores-layout">
      {/* ==== SIDEBAR / MENÚ LATERAL (igual que en Colmenas) ==== */}
      <aside className="sensores-sidebar">
        <div className="sensores-logo" onClick={() => navigate("/dashboard")}>
          <span className="sensores-logo-icon">🐝</span>
          <span className="sensores-logo-text">AbejaNet</span>
        </div>

        <nav className="sensores-nav">
          <button
            className="sensores-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>🏠</span>
            <span>Inicio</span>
          </button>
          <button
            className="sensores-nav-item"
            onClick={() => navigate("/colmenas")}
          >
            <span>🍯</span>
            <span>Colmenas</span>
          </button>
          <button
            className="sensores-nav-item"
            onClick={() => navigate("/reportes")}
          >
            <span>📊</span>
            <span>Reportes</span>
          </button>
          <button
            className="sensores-nav-item sensores-nav-item-active"
            onClick={() => navigate("/sensores")}
          >
            <span>📡</span>
            <span>Sensores</span>
          </button>
          <button
            className="sensores-nav-item"
            onClick={() => navigate("/cuenta")}
          >
            <span>👤</span>
            <span>Cuenta</span>
          </button>
        </nav>
      </aside>

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="sensores-main">
        {/* Header estilo Colmenas */}
        <header className="sensores-header">
          <div>
            <p className="sensores-badge">Panel de control</p>
            <h1>Gestión de Sensores</h1>
            <p className="sensores-subtitle">
              Administra los sensores instalados en tus colmenas, su estado y
              fecha de instalación.
            </p>
          </div>
          <div className="sensores-header-resumen">
            <span className="sensores-resumen-pill">
              Total: <strong>{sensores.length}</strong>
            </span>
          </div>
        </header>

        {/* Tarjeta de filtros + formulario */}
        <section className="sensores-card">
          {/* Filtros arriba en barra horizontal */}
          <div className="form-sensor-filtros">
            <select
              name="filtro_colmena"
              value={filtroColmena}
              onChange={(e) => setFiltroColmena(e.target.value)}
            >
              <option value="">-- Filtrar por Colmena --</option>
              {colmenas.map((colmena) => (
                <option key={colmena.id} value={colmena.id}>
                  {colmena.nombre}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="filtro_mac"
              placeholder="Buscar por MAC Address..."
              value={filtroMac}
              onChange={(e) => setFiltroMac(e.target.value)}
            />

            <button
              type="button"
              className="btn-secundario"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          </div>

          {/* Formulario como grid */}
          <form className="form-sensor" onSubmit={handleSubmit}>
            <select
              name="colmena_id"
              value={formData.colmena_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar Colmena --</option>
              {colmenas.map((colmena) => (
                <option key={colmena.id} value={colmena.id}>
                  {colmena.nombre}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="tipo_sensor"
              placeholder="Tipo de Sensor"
              value={formData.tipo_sensor}
              onChange={handleChange}
              required
            />

            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar Estado --</option>
              {estadosDisponibles.map((est) => (
                <option key={est} value={est}>
                  {est.charAt(0).toUpperCase() + est.slice(1)}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="mac_address"
              placeholder="MAC Address (Ej: AA:BB:CC:..)"
              value={formData.mac_address}
              onChange={handleChange}
            />

            <input
              type="date"
              name="fecha_instalacion"
              value={formData.fecha_instalacion}
              onChange={handleChange}
            />

            <div className="form-sensor-actions">
              <button type="submit" className="btn-primario">
                {editing ? "Actualizar Sensor" : "Agregar Sensor"}
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

        {/* Tabla de sensores en tarjeta aparte */}
        <section className="sensores-card">
          {loading ? (
            <div className="cuenta-loading">Cargando sensores...</div>
          ) : sensores.length === 0 ? (
            <p className="sensores-empty">
              No hay sensores que coincidan con los filtros.
            </p>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-sensores">
                <thead>
                  <tr>
                    <th>Colmena</th>
                    <th>Tipo de Sensor</th>
                    <th>MAC Address</th>
                    <th>Estado</th>
                    <th>Fecha de Instalación</th>
                    <th>Última Lectura</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sensores.map((sensor) => (
                    <tr key={sensor.id}>
                      <td>{sensor.nombre_colmena || sensor.colmena_id}</td>
                      <td>{sensor.tipo_sensor}</td>
                      <td>{sensor.mac_address || "N/A"}</td>
                      <td>
                        <span className={`estado-pill estado-${sensor.estado}`}>
                          {sensor.estado}
                        </span>
                      </td>
                      <td>
                        {sensor.fecha_instalacion
                          ? new Date(
                              sensor.fecha_instalacion
                            ).toLocaleDateString("es-MX")
                          : "Sin fecha"}
                      </td>
                      <td>
                        {sensor.ultima_lectura_en
                          ? new Date(
                              sensor.ultima_lectura_en
                            ).toLocaleDateString("es-MX")
                          : "Sin lectura"}
                      </td>
                      <td className="tabla-sensores-actions">
                        <button
                          className="editar"
                          onClick={() => handleEdit(sensor)}
                        >
                          ✏️
                        </button>
                        <button
                          className="eliminar"
                          onClick={() => handleDelete(sensor.id)}
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
