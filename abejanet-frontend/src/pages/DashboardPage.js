import React, { useMemo } from "react";
import "./DashboardPage.css";
import logo from "../assets/abeja_logo.png";
import { useLocation, useNavigate, Link } from "react-router-dom";

function StatChip({ label, value }) {
  return (
    <div className="dash-stat-chip">
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
    </div>
  );
}

function DashboardPage() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const email = usuario?.correo_electronico || "Invitado";
  const nombre = usuario?.nombre || "Apicultor";

  const initials = useMemo(() => {
    const base = (email || "U").trim();
    return base.slice(0, 2).toUpperCase();
  }, [email]);

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/dashboard", label: "Inicio", icon: "🏠" },
    { to: "/colmenas", label: "Colmenas", icon: "🐝" },
    { to: "/reportes", label: "Reportes", icon: "📄" },
    { to: "/sensores", label: "Sensores", icon: "📡" },
    { to: "/cuenta", label: "Cuenta", icon: "👤" },
  ];

  // Datos simulados para mostrar algo de info
  const kpis = {
    colmenasTotales: 3,
    apiarios: 2,
    sensoresActivos: 4,
    alertasHoy: 0,
  };

  return (
    <div className="dashboard-layout">
      {/* ==== SIDEBAR ==== */}
      <aside className="dashboard-sidebar">
        <div
          className="dashboard-logo"
          onClick={() => navigate("/dashboard")}
          title="Ir al inicio"
        >
          <img src={logo} alt="AbejaNet" className="dashboard-logo-img" />
          <span className="dashboard-logo-text">AbejaNet</span>
        </div>

        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <button
              key={item.to}
              className={
                "dashboard-nav-item" +
                (location.pathname === item.to
                  ? " dashboard-nav-item-active"
                  : "")
              }
              onClick={() => navigate(item.to)}
            >
              <span className="dashboard-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer" title={email}>
          <div className="dashboard-user-initials">{initials}</div>
          <div className="dashboard-user-meta">
            <span className="dashboard-user-name">{nombre}</span>
            <span className="dashboard-user-email">{email}</span>
          </div>
        </div>
      </aside>

      {/* ==== CONTENIDO PRINCIPAL ==== */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-badge">Panel general</p>
            <h1>Bienvenido, {nombre.split(" ")[0]} 👋</h1>
            <p className="dashboard-subtitle">
              Monitorea el estado de tus apiarios, colmenas y sensores desde un
              solo lugar.
            </p>
          </div>

          <div className="dashboard-header-stats">
            <StatChip label="Colmenas" value={kpis.colmenasTotales} />
            <StatChip label="Apiarios" value={kpis.apiarios} />
            <StatChip label="Sensores activos" value={kpis.sensoresActivos} />
            <StatChip label="Alertas hoy" value={kpis.alertasHoy} />
          </div>
        </header>

        {/* Tarjeta hero con CTA */}
        <section className="dashboard-card dashboard-hero">
          <div>
            <h2>Visión rápida de tu sistema 🐝</h2>
            <p>
              Revisa qué colmenas están registradas, qué sensores tienes
              instalados y genera reportes para analizar la producción de tus
              apiarios.
            </p>
            <div className="dashboard-hero-actions">
              <Link to="/colmenas" className="btn-primario">
                Ver colmenas
              </Link>
              <Link to="/sensores" className="btn-secundario">
                Gestionar sensores
              </Link>
            </div>
          </div>
          <ul className="dashboard-hero-list">
            <li>• Monitoreo remoto 24/7 de tus colmenas.</li>
            <li>• Centraliza la información de todos tus apiarios.</li>
            <li>• Detecta cambios bruscos en peso o temperatura.</li>
          </ul>
        </section>

        {/* Grid de tarjetas de información */}
        <section className="dashboard-grid">
          {/* Columna 1 */}
          <article className="dashboard-card">
            <h3>Resumen de tus colmenas</h3>
            <p>
              Actualmente tienes <strong>{kpis.colmenasTotales}</strong>{" "}
              colmenas registradas en{" "}
              <strong>{kpis.apiarios}</strong> apiarios.
            </p>
            <p>
              Desde el módulo de{" "}
              <Link to="/colmenas" className="link-inline">
                Colmenas
              </Link>{" "}
              puedes:
            </p>
            <ul className="dashboard-list">
              <li>Registrar nuevas colmenas y asignarlas a un apiario.</li>
              <li>Actualizar descripciones y ubicaciones.</li>
              <li>Consultar el detalle histórico de cada colmena.</li>
            </ul>
          </article>

          <article className="dashboard-card">
            <h3>Estado de sensores</h3>
            <p>
              Tienes <strong>{kpis.sensoresActivos}</strong> sensores activos
              reportando datos. Para cada colmena puedes conectar sensores de:
            </p>
            <ul className="dashboard-list">
              <li>⚖️ Peso (control de producción y alimento).</li>
              <li>🌡️ Temperatura y humedad interna.</li>
              <li>📦 Movimiento / apertura de tapa.</li>
            </ul>
            <p className="dashboard-note">
              Desde{" "}
              <Link to="/sensores" className="link-inline">
                Gestión de Sensores
              </Link>{" "}
              puedes ver la lista completa, editar estados y registrar nuevas
              instalaciones.
            </p>
          </article>

          {/* Columna 2 */}
          <article className="dashboard-card">
            <h3>Alertas y seguridad</h3>
            <p>
              Las alertas automáticas te ayudan a reaccionar cuando algo se
              sale de lo normal:
            </p>
            <ul className="dashboard-list">
              <li>🔔 Disminución brusca de peso (posible robo o enjambrazón).</li>
              <li>🔥 Temperaturas extremas dentro de la colmena.</li>
              <li>📉 Falta de actividad prolongada en alguna colmena.</li>
            </ul>
            <p className="dashboard-note">
              En futuras versiones podrás configurar umbrales personalizados
              por apiario y recibir notificaciones en tu celular.
            </p>
          </article>

          <article className="dashboard-card">
            <h3>Reportes y análisis</h3>
            <p>
              Desde el módulo de{" "}
              <Link to="/reportes" className="link-inline">
                Reportes
              </Link>{" "}
              podrás:
            </p>
            <ul className="dashboard-list">
              <li>Descargar reportes en PDF o CSV.</li>
              <li>Visualizar gráficas por colmena o apiario.</li>
              <li>Comparar producción entre temporadas.</li>
            </ul>
            <p className="dashboard-note">
              Usa estos reportes para tomar decisiones sobre cambio de
              ubicación, alimentación o renovación de colmenas.
            </p>
          </article>

          {/* Columna 3 */}
          <article className="dashboard-card dashboard-tips">
            <h3>Buenas prácticas apícolas</h3>
            <ul className="dashboard-list">
              <li>
                Revisa físicamente tus colmenas al menos{" "}
                <strong>una vez por semana</strong>.
              </li>
              <li>
                Registra cambios importantes (división, sustitución de reina,
                tratamientos) en tus notas.
              </li>
              <li>
                Mantén un calendario de floraciones para entender mejor los
                picos de producción.
              </li>
              <li>
                Usa el historial de peso para decidir cuándo colocar o retirar
                alzas.
              </li>
            </ul>
          </article>

          <article className="dashboard-card">
            <h3>Próximos pasos recomendados</h3>
            <ol className="dashboard-steps">
              <li>Registra todas tus colmenas activas en el sistema.</li>
              <li>Asocia al menos un sensor de peso a cada apiario.</li>
              <li>
                Configura una rutina semanal de revisión usando los reportes.
              </li>
              <li>
                Documenta cambios importantes en notas o en tu cuaderno de
                campo.
              </li>
            </ol>
            <p className="dashboard-note">
              Entre más datos registres, más útil será AbejaNet para entender el
              comportamiento de tus colmenas.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
