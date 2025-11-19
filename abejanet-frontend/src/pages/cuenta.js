import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cuenta.css";

export default function Cuenta() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario"));
    if (userData?.correo_electronico) {
      fetch(`https://abejanet-backend-cplf.onrender.com/api/usuarios/${userData.correo_electronico}`)
        .then(res => res.json())
        .then(data => {
          setUsuario(data);
          setFormData(data);
        })
        .catch(() => {
          setUsuario(userData);
          setFormData(userData);
        });
    } else {
      setUsuario({ nombre: "Invitado", correo_electronico: "—" });
    }
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const guardarCambios = () => {
    fetch(`https://abejanet-backend-cplf.onrender.com/api/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(data => {
        setUsuario(data);
        setEditando(false);
        localStorage.setItem("usuario", JSON.stringify(data));
        alert("Perfil actualizado correctamente");
      })
      .catch(err => {
        console.error("Error:", err);
        alert("Error al guardar cambios");
      });
  };

  if (!usuario) return <div className="cuenta-loading">Cargando datos...</div>;

  return (
    <div className="cuenta-container">
      <div className="cuenta-card">

        {/* 🔙 FLECHA DENTRO DEL CUADRO */}
        <div className="cuenta-back-icon" onClick={() => navigate("/dashboard")}>
          ←
        </div>

        <div className="cuenta-avatar">
          {usuario.nombre?.charAt(0).toUpperCase() || "U"}
        </div>

        {editando ? (
          <div className="cuenta-form">
            <input name="nombre" value={formData.nombre || ""} onChange={handleChange} />
            <input name="apellido_paterno" value={formData.apellido_paterno || ""} onChange={handleChange} />
            <input name="apellido_materno" value={formData.apellido_materno || ""} onChange={handleChange} />
            <input name="correo_electronico" value={formData.correo_electronico || ""} onChange={handleChange} />

            <div className="cuenta-botones">
              <button onClick={guardarCambios} className="btn-guardar">Guardar</button>
              <button onClick={() => { setEditando(false); setFormData(usuario); }} className="btn-cancelar">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="cuenta-nombre">
              {usuario.nombre} {usuario.apellido_paterno} {usuario.apellido_materno}
            </h2>
            <p className="cuenta-correo">{usuario.correo_electronico}</p>

            <div className="cuenta-info">
              <div><strong>Rol:</strong> {usuario.rol_id === 1 ? "Administrador" : "Usuario"}</div>
              <div><strong>Estado:</strong> {usuario.esta_activo ? <span className="estado-activo">Activo</span> : <span className="estado-inactivo">Inactivo</span>}</div>
              <div><strong>Registrado el:</strong> {new Date(usuario.fecha_creacion).toLocaleDateString()}</div>
            </div>

            <button onClick={() => setEditando(true)} className="cuenta-btn">
              Editar Perfil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
