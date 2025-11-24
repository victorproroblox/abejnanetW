import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CreateColmenaPage.css";

export default function CreateColmenaPage() {
  const [apiarios, setApiarios] = useState([]);
  const [form, setForm] = useState({
    apiario_id: "",
    nombre: "",
    descripcion_especifica: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  // Cargar apiarios al iniciar
  useEffect(() => {
    fetch("https://abejanet-backend-cplf.onrender.com/api/apiarios")
      .then((r) => r.json())
      .then((data) => setApiarios(data || []))
      .catch(() => setApiarios([]));
  }, []);

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.apiario_id || !form.nombre.trim()) {
      setErrorMsg("Por favor llena todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://abejanet-backend-cplf.onrender.com/api/colmenas",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear colmena");
      }

      setSuccessMsg("✅ Colmena creada correctamente");
      setTimeout(() => navigate("/colmenas"), 1200);
    } catch (err) {
      setErrorMsg(err.message || "Error del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-colmena-root">
      <div className="create-colmena-shell">
        {/* Encabezado */}
        <header className="create-colmena-header">
          <div>
            <h2>➕ Crear nueva colmena</h2>
            <p className="create-colmena-sub">
              Registra una colmena dentro de uno de tus apiarios para comenzar a
              monitorearla.
            </p>
          </div>
          <Link to="/colmenas" className="crumb-link">
            ← Volver a colmenas
          </Link>
        </header>

        <div className="create-colmena-layout">
          {/* Tarjeta principal del formulario */}
          <form
            onSubmit={handleSubmit}
            className="create-colmena-form-card"
          >
            {/* Combo de apiarios */}
            <label className="form-field">
              <span>Apiario *</span>
              <select
                name="apiario_id"
                value={form.apiario_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un apiario…</option>
                {apiarios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </label>

            {/* Nombre */}
            <label className="form-field">
              <span>Nombre de la colmena *</span>
              <input
                type="text"
                name="nombre"
                placeholder="Ej. Colmena Norte 1"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </label>

            {/* Descripción */}
            <label className="form-field">
              <span>Descripción (opcional)</span>
              <textarea
                name="descripcion_especifica"
                rows="4"
                placeholder="Detalles o notas de esta colmena..."
                value={form.descripcion_especifica}
                onChange={handleChange}
              />
            </label>

            {/* Mensajes */}
            {errorMsg && (
              <div className="alert error">
                <p>{errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="alert success">
                <p>{successMsg}</p>
              </div>
            )}

            {/* Botones */}
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear colmena"}
              </button>
            </div>
          </form>

          {/* Columna derecha con info / tips */}
          <aside className="create-colmena-aside">
            <h3>🐝 Buenas prácticas</h3>
            <ul>
              <li>
                Usa nombres que te ayuden a ubicarla rápido
                <br />
                <span className="hint">Ejemplo: “Norte 1”, “Sur 3 – Producción”.</span>
              </li>
              <li>
                La descripción es ideal para anotar
                <br />
                <span className="hint">
                  Estado de la reina, recambios, tratamientos recientes, etc.
                </span>
              </li>
              <li>
                Asegúrate de asignarla al apiario correcto para
                que los reportes sean más claros.
              </li>
            </ul>

            <div className="create-colmena-meta">
              <p>
                Cada colmena registrada se conectará con tus sensores para
                mostrar peso, ambiente y alertas dentro del panel principal.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
