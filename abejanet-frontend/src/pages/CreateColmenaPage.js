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
    fetch("http://localhost:4000/api/apiarios")
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
      const res = await fetch("http://localhost:4000/api/colmenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

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
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>➕ Crear nueva colmena</h2>
        <Link to="/colmenas" className="crumb-link">
          ← Volver a Colmenas
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: 20,
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(6px)",
        }}
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
    </div>
  );
}
