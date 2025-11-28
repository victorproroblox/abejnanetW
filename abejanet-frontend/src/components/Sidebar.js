import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import logo from "../assets/abeja_logo.png"; // DESCOMENTAR ESTA LÍNEA SI TIENES EL LOGO
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener datos del usuario desde localStorage (si existen)
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const email = usuario?.correo_electronico || "Invitado";
  const nombre = usuario?.nombre || "Usuario";

  // Generar iniciales para el avatar
  const initials = useMemo(() => {
    const base = (email || "U").trim();
    return base.slice(0, 2).toUpperCase();
  }, [email]);

  // CONFIGURACIÓN DEL MENÚ
  const navItems = [
    { to: "/dashboard", label: "Inicio", icon: "🏠" },
    { to: "/colmenas", label: "Colmenas", icon: "🍯" },
    { to: "/reportes", label: "Reportes", icon: "📊" },
    { to: "/sensores", label: "Sensores", icon: "📡" },
    { to: "/usuarios", label: "Usuarios", icon: "👥" }, // Opción agregada
    { to: "/cuenta", label: "Cuenta", icon: "👤" },
  ];

  return (
    <aside className="app-sidebar">
      {/* LOGO */}
      <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
        {/* Si tienes el logo, descomenta la etiqueta img y borra el span del emoji */}
        <span style={{ fontSize: "1.5rem", marginRight: "8px" }}>🐝</span>
        {/* <img src={logo} alt="AbejaNet" className="sidebar-logo-img" /> */}
        <span className="sidebar-logo-text">AbejaNet</span>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.to}
            className={`sidebar-nav-item ${
              location.pathname === item.to ? "active" : ""
            }`}
            onClick={() => navigate(item.to)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* FOOTER DE USUARIO */}
      <div className="sidebar-footer" title={email}>
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <span className="user-name">{nombre.split(" ")[0]}</span>
          <span className="user-role">Conectado</span>
        </div>
      </div>
    </aside>
  );
}