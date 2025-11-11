import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sensores.css";

export default function Sensores() {
  const navigate = useNavigate();
  const [sensores, setSensores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:4000/api/sensores")
      .then((res) => res.json())
      .then((data) => {
        setSensores(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar sensores:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="cuenta-loading">Cargando sensores...</div>;

  return (
    <div className="cuenta-container">
      <div className="cuenta-card">
        {/* Flecha de regreso */}
        <div className="cuenta-back-icon" onClick={() => navigate("/dashboard")}>
          ←
        </div>

        <h2 className="cuenta-nombre">📡 Sensores</h2>

        {sensores.length === 0 ? (
          <p>No hay sensores registrados.</p>
        ) : (
          <table className="tabla-sensores">
            <thead>
              <tr>
                <th>Colmena</th>
                <th>Tipo de Sensor</th>
                <th>Estado</th>
                <th>Fecha de Instalación</th>
                <th>Última Lectura</th>
              </tr>
            </thead>
            <tbody>
              {sensores.map((sensor) => (
                <tr key={sensor.id}>
                  <td>{sensor.colmena_id || "—"}</td>
                  <td>{sensor.tipo_sensor || "—"}</td>
                  <td>{sensor.estado || "—"}</td>
                  <td>
                    {sensor.fecha_instalacion
                      ? new Date(sensor.fecha_instalacion).toLocaleString("es-MX")
                      : "Sin fecha"}
                  </td>
                  <td>
                    {sensor.ultima_lectura_en
                      ? new Date(sensor.ultima_lectura_en).toLocaleString("es-MX")
                      : "Sin lectura"}
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
