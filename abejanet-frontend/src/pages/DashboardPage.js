import React, { useState, useMemo } from "react";
import "./DashboardPage.css";
import logo from "../assets/abeja_logo.png";
import { Link, useLocation } from "react-router-dom";

/* ====== ICONOS ====== */
function BeeIcon(props){ 
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 8.5c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 6l3 3M18 6l-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 4v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M5 13h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M7.5 18.5C9 20 10.5 20.5 12 20.5s3-.5 4.5-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon(props){
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function DashboardPage() {
  const [open, setOpen] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  const email = usuario?.correo_electronico || "Invitado";
  const initials = useMemo(() => {
    const base = (email || "").trim();
    if (!base) return "U";
    return base.slice(0, 2).toUpperCase();
  }, [email]);

  const navItems = [
    { to: "/dashboard", label: "🏠 Inicio" },
    { to: "/colmenas", label: "🐝 Colmenas" },
    { to: "/reportes", label: "📄 Reportes" },
    { to: "/sensores", label: "🛠 Sensores" },
    { to: "/cuenta", label: "👤 Cuenta" },
  ];

  const closeOnRoute = () => setOpen(false);

  return (
    <div className={`dash-root ${open ? "drawer-open" : ""}`}>
      {/* Topbar */}
      <header className="topbar">
        {/* Botón con abejita -> X */}
        <button
          className="icon-btn"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <CloseIcon /> : <BeeIcon />}
        </button>

        <div className="brand">
          <img src={logo} alt="AbejaNet" />
          <span className="brand-name">AbejaNet</span>
        </div>

        <div className="user-chip" title={email}>
          <span className="user-initials">{initials}</span>
          <span className="user-mail">{email}</span>
        </div>
      </header>

      {/* Drawer (menú lateral) */}
      <aside className="drawer" role="navigation" aria-label="Menú principal">
        <div className="drawer-head">
          <img src={logo} alt="AbejaNet" />
          <strong>AbejaNet</strong>
        </div>
        <ul className="drawer-links">
          {navItems.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={location.pathname === to ? "active" : ""}
                onClick={closeOnRoute}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="drawer-footer">
          <small>{email}</small>
        </div>
      </aside>

      {/* Overlay para cerrar el drawer en mobile */}
      <button
        className="overlay"
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
      />

      {/* Contenido */}
      <main className="content">
        <section className="hero">
          <div className="hero-card">
            <h1>Bienvenido 👋</h1>
            <p>Monitorea tus colmenas con datos claros y alertas oportunas.</p>
          </div>
        </section>

        <section className="cards-grid">
          <article className="card">
            <h4>¿Qué es AbejaNet?</h4>
            <p>
              AbejaNet es una plataforma inteligente para el monitoreo remoto de colmenas, que ayuda a prevenir pérdidas,
              mejorar la producción de miel y cuidar a las abejas. Utiliza sensores de peso, movimiento e inteligencia artificial
              para mantenerte informado en todo momento.
            </p>
          </article>

          <article className="card">
            <h4>📌 Beneficios del sistema</h4>
            <ul className="bullets">
              <li>🕒 Monitoreo 24/7</li>
              <li>📍 Acceso desde cualquier lugar</li>
              <li>🚨 Alertas inmediatas</li>
              <li>📥 Reportes descargables</li>
            </ul>
          </article>

          <article className="card">
            <h4>📰 Noticias o Consejos</h4>
            <p>
              – Cómo detectar enjambrazón a tiempo<br />
              – Qué hacer si una colmena deja de producir<br />
              – Recomendaciones para mantener tus colmenas seguras
            </p>
            <h5>🐝 Importancia de las Abejas</h5>
            <p>
              Las abejas son responsables de más del 70% de la polinización mundial. Su monitoreo protege el ecosistema
              y garantiza la producción de alimentos.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
