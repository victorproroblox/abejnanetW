// src/pages/EditColmenaPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./CreateColmenaPage.css"; // reutilizamos el mismo estilo del form de creación

export default function EditColmenaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // catálogo de apiarios
  const [apiarios, setApiarios] = useState([]);
  const [loadingApiarios, setLoadingApiarios] = useState(true);

  // formulario
  const [form, setForm] = useState({
    apiario_id: "",
    nombre: "",
    descripcion_especifica: "",
  });

  // estados UI
  const [loading, setLoading] = useState(true);   // cargando colmena
  const [saving, setSaving] = useState(false);    // guardando cambios
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Carga inicial (apiarios + colmena)
  useEffect(() => {
    let alive = true;

    const fetchJsonSafe = async (url) => {
      const r = await fetch(url);
      const ct = r.headers.get("content-type") || "";
      const raw = await r.text();
      if (!ct.includes("application/json")) {
        // El backend regresó HTML (index.html o página de error)
        throw new Error(
          `La URL ${url} devolvió contenido no-JSON. ` +
          `Revisa que el endpoint exista y que el catch-all de React esté al final.`
        );
      }
      const data = JSON.parse(raw);
      if (!r.ok) throw new Error(data?.error || "Error en la respuesta del servidor");
      return data;
    };

    Promise.all([
      fetchJsonSafe("https://abejanet-backend-cplf.onrender.com/api/apiarios").catch(() => []),
      fetchJsonSafe(`https://abejanet-backend-cplf.onrender.com/api/colmenas/${id}`),
    ])
      .then(([apiariosResp, colmena]) => {
        if (!alive) return;
        setApiarios(apiariosResp || []);
        setForm({
          apiario_id: colmena.apiario_id ?? "",
          nombre: colmena.nombre ?? "",
          descripcion_especifica: colmena.descripcion_especifica ?? "",
        });
      })
      .catch((err) => {
        if (!alive) return;
        setErrorMsg(err.message || "Error al cargar datos");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setLoadingApiarios(false);
      });

    return () => { alive = false; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const isValid = useMemo(() => {
    return String(form.apiario_id).trim() !== "" && String(form.nombre).trim().length > 0;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isValid) {
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`https://abejanet-backend-cplf.onrender.com/api/colmenas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiario_id: form.apiario_id,
          nombre: form.nombre,
          descripcion_especifica: form.descripcion_especifica,
        }),
      });

      // misma defensa contra HTML en la respuesta
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      const data = ct.includes("application/json") ? JSON.parse(raw) : { error: raw };

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo guardar");
      }

      setSuccessMsg("✅ Cambios guardados");
      setTimeout(() => navigate("/colmenas"), 1000);
    } catch (err) {
      setErrorMsg(err.message || "Error del servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", color: "var(--text)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>✏️ Editar colmena</h2>
          <Link to="/colmenas" className="crumb-link">← Volver a Colmenas</Link>
        </div>
        <div className="alert">Cargando datos…</div>
      </div>
    );
  }

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
        <h2 style={{ margin: 0 }}>✏️ Editar colmena #{id}</h2>
        <Link to="/colmenas" className="crumb-link">
          ← Volver a Colmenas
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: 20,
          borderRadius: 16,
          background: "#1e1f23",
          border: "1px solid #2b2d33",
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        }}
      >
        {/* Apiario */}
        <label className="form-field">
          <span>Apiario *</span>
          <select
            name="apiario_id"
            value={form.apiario_id}
            onChange={handleChange}
            required
            disabled={loadingApiarios}
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

        {/* Acciones */}
        <div className="form-actions" style={{ gap: 10 }}>
          <Link to="/colmenas" className="crumb-link" style={{ padding: "8px 12px" }}>
            Cancelar
          </Link>
          <button type="submit" disabled={saving || !isValid}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
