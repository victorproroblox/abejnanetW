import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Crud_usu.css"; // O el nombre que le pongas a tu CSS

export default function Crud_usu() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Filtros
  const [filtroCorreo, setFiltroCorreo] = useState("");

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo_electronico: "",
    contrasena: "",
    rol_id: "",
    esta_activo: "true"
  });

  // --- FUNCIONES DE CARGA ---

  const cargarUsuarios = () => {
    const params = new URLSearchParams();
    if (filtroCorreo) params.append("correo", filtroCorreo);
    const queryString = params.toString();

    setLoading(true);
    // Nota: La ruta coincide con la definida en el backend (api/usuarios)
    return fetch(`https://abejanet-backend-cplf.onrender.com/api/usuarios?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        setUsuarios(data);
      })
      .catch((err) => {
        console.error("Error al cargar usuarios:", err);
      })
      .finally(() => setLoading(false));
  };

  const cargarRoles = () => {
    // Asegúrate de tener este endpoint o ajusta esta parte
    return fetch("https://abejanet-backend-cplf.onrender.com/api/roles")
      .then((res) => res.json())
      .then((data) => setRoles(data))
      .catch((err) => {
        console.error("Error al cargar roles:", err);
        // Fallback si falla el endpoint
        setRoles([{id:1, nombre: 'Admin'}, {id:2, nombre:'Cliente'}]);
      });
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [filtroCorreo]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      correo_electronico: "",
      contrasena: "",
      rol_id: "",
      esta_activo: "true"
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `https://abejanet-backend-cplf.onrender.com/api/usuarios/${editing}`
      : "https://abejanet-backend-cplf.onrender.com/api/usuarios";

    // Convertir 'esta_activo' string a boolean para la DB
    const payload = {
        ...formData,
        esta_activo: formData.esta_activo === "true"
    };

    // Si editamos y la contraseña está vacía, la eliminamos del payload
    if(editing && !payload.contrasena) {
        delete payload.contrasena;
    }

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
        cargarUsuarios();
        resetForm();
        alert(editing ? "Usuario actualizado" : "Usuario creado");
      })
      .catch((err) => {
        console.error("Error al guardar usuario:", err.message);
        alert(err.message);
      });
  };

  const handleEdit = (usuario) => {
    setEditing(usuario.id);
    setFormData({
      nombre: usuario.nombre || "",
      apellido_paterno: usuario.apellido_paterno || "",
      apellido_materno: usuario.apellido_materno || "",
      correo_electronico: usuario.correo_electronico || "",
      contrasena: "", // Se deja vacía por seguridad
      rol_id: usuario.rol_id || "",
      esta_activo: usuario.esta_activo ? "true" : "false"
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      fetch(`https://abejanet-backend-cplf.onrender.com/api/usuarios/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => cargarUsuarios())
        .catch((err) => console.error("Error al eliminar usuario:", err));
    }
  };

  const limpiarFiltros = () => {
    setFiltroCorreo("");
  };

  return (
    <div className="usuarios-layout">
      {/* SIDEBAR */}
      <aside className="usuarios-sidebar">
        <div className="usuarios-logo" onClick={() => navigate("/dashboard")}>
          <span className="usuarios-logo-icon">🐝</span>
          <span className="usuarios-logo-text">AbejaNet</span>
        </div>

        <nav className="usuarios-nav">
          <button className="usuarios-nav-item" onClick={() => navigate("/dashboard")}>
            <span>🏠</span> <span>Inicio</span>
          </button>
          <button className="usuarios-nav-item" onClick={() => navigate("/colmenas")}>
            <span>🍯</span> <span>Colmenas</span>
          </button>
          <button className="usuarios-nav-item" onClick={() => navigate("/reportes")}>
            <span>📊</span> <span>Reportes</span>
          </button>
          <button className="usuarios-nav-item" onClick={() => navigate("/sensores")}>
            <span>📡</span> <span>Sensores</span>
          </button>
          {/* Botón activo */}
          <button className="usuarios-nav-item usuarios-nav-item-active" onClick={() => navigate("/usuarios")}>
            <span>👥</span> <span>Usuarios</span>
          </button>
          <button className="usuarios-nav-item" onClick={() => navigate("/cuenta")}>
            <span>👤</span> <span>Cuenta</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="usuarios-main">
        <header className="usuarios-header">
          <div>
            <p className="usuarios-badge">Administración</p>
            <h1>Gestión de Usuarios</h1>
            <p className="usuarios-subtitle">
              Administra el acceso y roles de los usuarios del sistema.
            </p>
          </div>
          <div className="usuarios-header-resumen">
            <span className="usuarios-resumen-pill">
              Total: <strong>{usuarios.length}</strong>
            </span>
          </div>
        </header>

        {/* TARJETA: FILTROS + FORMULARIO */}
        <section className="usuarios-card">
          <div className="form-usuario-filtros">
            <input
              type="text"
              placeholder="Buscar por correo..."
              value={filtroCorreo}
              onChange={(e) => setFiltroCorreo(e.target.value)}
            />
            <button
              type="button"
              className="btn-secundario"
              onClick={limpiarFiltros}
            >
              Limpiar
            </button>
          </div>

          <form className="form-usuario" onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
             <input
              type="text"
              name="apellido_paterno"
              placeholder="Apellido Paterno"
              value={formData.apellido_paterno}
              onChange={handleChange}
            />
             <input
              type="text"
              name="apellido_materno"
              placeholder="Apellido Materno"
              value={formData.apellido_materno}
              onChange={handleChange}
            />
            
            <input
              type="email"
              name="correo_electronico"
              placeholder="Correo Electrónico"
              value={formData.correo_electronico}
              onChange={handleChange}
              required
            />

            <select
              name="rol_id"
              value={formData.rol_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar Rol --</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>

            <select
              name="esta_activo"
              value={formData.esta_activo}
              onChange={handleChange}
              required
            >
               <option value="true">Activo</option>
               <option value="false">Inactivo</option>
            </select>

            <input
              type="password"
              name="contrasena"
              placeholder={editing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
              value={formData.contrasena}
              onChange={handleChange}
              required={!editing} 
            />

            <div className="form-usuario-actions">
              <button type="submit" className="btn-primario">
                {editing ? "Actualizar Usuario" : "Crear Usuario"}
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

        {/* TARJETA: TABLA */}
        <section className="usuarios-card">
          {loading ? (
            <div className="cuenta-loading">Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <p className="usuarios-empty">
              No hay usuarios que coincidan con los filtros.
            </p>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-usuarios">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usu) => (
                    <tr key={usu.id}>
                      <td>{usu.nombre} {usu.apellido_paterno}</td>
                      <td>{usu.correo_electronico}</td>
                      <td>{usu.nombre_rol || usu.rol_id}</td>
                      <td>
                        <span className={`estado-pill ${usu.esta_activo ? "estado-activo" : "estado-inactivo"}`}>
                          {usu.esta_activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="tabla-usuarios-actions">
                        <button
                          className="editar"
                          onClick={() => handleEdit(usu)}
                        >
                          ✏️
                        </button>
                        <button
                          className="eliminar"
                          onClick={() => handleDelete(usu.id)}
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