import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sensores.css";

export default function Sensores() {
  const navigate = useNavigate();
  const [sensores, setSensores] = useState([]);
  const [colmenas, setColmenas] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); 

  // ---- NUEVOS ESTADOS PARA LOS FILTROS ----
  const [filtroColmena, setFiltroColmena] = useState("");
  const [filtroMac, setFiltroMac] = useState("");

  const estadosDisponibles = ['activo', 'inactivo', 'mantenimiento', 'no_asignado'];

  const [formData, setFormData] = useState({
    colmena_id: "",
    tipo_sensor: "",
    estado: "",
    fecha_instalacion: "",
    mac_address: "", 
  });

  // 🔹 Cargar sensores (¡AHORA USA LOS FILTROS!)
  const cargarSensores = () => {
    // ---- INICIO DE LA MODIFICACIÓN ----
    const params = new URLSearchParams();
    if (filtroColmena) {
      params.append('colmena', filtroColmena);
    }
    if (filtroMac) {
      params.append('mac', filtroMac);
    }
    const queryString = params.toString();
    // ---- FIN DE LA MODIFICACIÓN ----

    setLoading(true); // Mostramos loading en cada recarga
    return fetch(`http://localhost:4000/api/sensores?${queryString}`) // <-- URL con filtros
      .then((res) => res.json())
      .then((data) => {
        setSensores(data);
      })
      .catch((err) => {
        console.error("Error al cargar sensores:", err);
        throw err; 
      })
      .finally(() => {
        setLoading(false); // Ocultamos loading
      });
  };

  // 🔹 Cargar colmenas (para los dropdowns)
  const cargarColmenas = () => {
    return fetch("http://localhost:4000/api/colmenas")
      .then((res) => res.json())
      .then((data) => {
        setColmenas(data);
      })
      .catch((err) => {
        console.error("Error al cargar colmenas:", err);
        throw err; 
      });
  };

  // ---- useEffect SEPARADOS ----

  // 1. Carga las colmenas SÓLO UNA VEZ al montar el componente
  useEffect(() => {
    cargarColmenas();
  }, []); // <-- Array vacío = corre 1 vez

  // 2. Carga los sensores al montar Y CADA VEZ que un filtro cambie
  useEffect(() => {
    cargarSensores();
  }, [filtroColmena, filtroMac]); // <-- Dependencias: se re-ejecuta si cambian
  
  // ---- FIN DE useEffect SEPARADOS ----


  // 🔹 Manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para limpiar y resetear el formulario
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

  // 🔹 Agregar o editar sensor
  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `http://localhost:4000/api/sensores/${editing}`
      : "http://localhost:4000/api/sensores";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => { 
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({})); 
          throw new Error(errorData.error || `Error ${res.status}: No se pudo completar la operación`);
        }
        return res.json();
      })
      .then(() => {
        cargarSensores(); // Recarga los sensores (respetando los filtros)
        resetForm(); 
      })
      .catch((err) => {
        console.error("Error al guardar sensor:", err.message);
        alert(err.message); 
      });
  };

  // 🔹 Editar sensor
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
    window.scrollTo(0, 0); // Sube al formulario
  };

  // 🔹 Eliminar sensor
  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este sensor?")) {
      fetch(`http://localhost:4000/api/sensores/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then(() => cargarSensores()) // Recarga los sensores (respetando filtros)
        .catch((err) => console.error("Error al eliminar sensor:", err));
    }
  };

  // Función para limpiar los filtros
  const limpiarFiltros = () => {
    setFiltroColmena("");
    setFiltroMac("");
  };

  return (
    <div className="cuenta-container">
      <div className="cuenta-card">
        <div className="cuenta-back-icon" onClick={() => navigate("/dashboard")}>
          ←
        </div>

        <h2 className="cuenta-nombre">📡 Gestión de Sensores</h2>

        {/* ---- NUEVA BARRA DE FILTROS ---- */}
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

          <button type="button" className="cancelar" onClick={limpiarFiltros}>
            Limpiar Filtros
          </button>
        </div>
        {/* ---- FIN BARRA DE FILTROS ---- */}


        {/* 🟡 Formulario de Agregar/Editar */}
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
          
          <button type="submit">
            {editing ? "Actualizar Sensor" : "Agregar Sensor"}
          </button>
          {editing && (
            <button
              type="button"
              className="cancelar"
              onClick={resetForm} 
            >
              Cancelar
            </button>
          )}
        </form>

        {/* 📋 Tabla de sensores */}
        {/* Muestra "Cargando..." solo cuando loading es true */}
        {loading ? (
          <div className="cuenta-loading">Cargando sensores...</div>
        ) : sensores.length === 0 ? (
          <p>No hay sensores que coincidan con los filtros.</p>
        ) : (
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
                  <td>{sensor.estado}</td>
                  <td>
                    {sensor.fecha_instalacion
                      ? new Date(sensor.fecha_instalacion).toLocaleDateString(
                          "es-MX"
                        )
                      : "Sin fecha"}
                  </td>
                  <td>
                    {sensor.ultima_lectura_en
                      ? new Date(sensor.ultima_lectura_en).toLocaleDateString(
                          "es-MX"
                        )
                      : "Sin lectura"}
                  </td>
                  <td>
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
        )}
      </div>
    </div>
  );
}