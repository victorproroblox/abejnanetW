import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FaWeight,
  FaMapMarkerAlt,
  FaChartLine,
  FaBalanceScale,
} from "react-icons/fa";
import "./ColmenaDetallePage.css";
import logo from "../assets/abeja_logo.png";

/* ====== Iconos del menú ====== */
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

/* ====== Subcomponentes UI ====== */
function InfoChip({ icon, title, value }) {
  return (
    <div className="info-chip">
      <div className="chip-icon">{icon}</div>
      <div className="chip-text">
        <span className="chip-title">{title}</span>
        <span className="chip-value">{value ?? "—"}</span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, date }) {
  const cls = delta > 0 ? "delta positivo" : delta < 0 ? "delta negativo" : "delta neutro";
  const sign = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";
  return (
    <div className="kpi-card">
      <div className="kpi-icon">
        <FaWeight />
      </div>
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">
          {value !== null && value !== undefined ? `${value.toFixed(2)} kg` : "—"}
        </span>
        <span className={cls}>
          {delta !== null && delta !== undefined ? `${sign} ${Math.abs(delta).toFixed(2)} kg` : "—"}
        </span>
        {date && <span className="kpi-date">{date}</span>}
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-icon">{icon}</span>
        <h3 className="panel-title">{title}</h3>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function EmptyBox({ title = "Sin datos", children }) {
  return (
    <div className="empty-box">
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

function ColmenaDetallePage() {
  const { id } = useParams();
  const location = useLocation();

  // Drawer
  const [open, setOpen] = useState(false);

  // Datos
  const [colmena, setColmena] = useState(null);
  const [lecturas, setLecturas] = useState([]);
  const [pesoActual, setPesoActual] = useState(null);
  const [variacion, setVariacion] = useState(null);
  const [ultimaFecha, setUltimaFecha] = useState(null);
  const [fail, setFail] = useState(false);
  const [loading, setLoading] = useState(true);

  // Usuario (chip)
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const email = usuario?.correo_electronico || "Invitado";
  const initials = (email || "U").slice(0, 2).toUpperCase();

  const navItems = [
    { to: "/", label: "🏠 Inicio" },
    { to: "/colmenas", label: "🐝 Colmenas" },
    { to: "/reportes", label: "📄 Reportes" },
    { to: "/sensores", label: "🛠 Sensores" },
    { to: "/cuenta", label: "👤 Cuenta" },
  ];

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:4000/api/colmenas/${id}/detalle`)
      .then((res) => {
        setColmena(res.data.colmena);

        const lecturasProcesadas = (res.data.lecturas || []).map((l) => ({
          fecha: new Date(l.fecha_registro).getTime(),
          temperatura: l.temperatura ? parseFloat(l.temperatura) : null,
          humedad: l.humedad ? parseFloat(l.humedad) : null,
          peso: l.peso ? parseFloat(l.peso) : null,
        }));

        setLecturas(lecturasProcesadas);

        const ultima = lecturasProcesadas[0];
        const penultima = lecturasProcesadas[1];

        setPesoActual(ultima?.peso ?? null);
        setUltimaFecha(ultima?.fecha ?? null);
        if (ultima?.peso && penultima?.peso) {
          setVariacion(ultima.peso - penultima.peso);
        } else {
          setVariacion(null);
        }
      })
      .catch((err) => {
        console.error("Error cargando detalles de colmena:", err);
        setFail(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatFecha = (ms) =>
    new Date(ms).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const ultimaFechaFmt = useMemo(
    () => (ultimaFecha ? formatFecha(ultimaFecha) : null),
    [ultimaFecha]
  );

  return (
    <div className={`dash-root ${open ? "drawer-open" : ""}`}>
      {/* ====== TOPBAR con menú ====== */}
      <header className="topbar">
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

      {/* ====== DRAWER ====== */}
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
                onClick={() => setOpen(false)}
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

      {/* Overlay */}
      <button className="overlay" aria-label="Cerrar menú" onClick={() => setOpen(false)} />

      {/* ====== CONTENIDO ====== */}
      <main className="content">
        <div className="detalle-colmena-page">
          {/* Breadcrumb / encabezado */}
          <div className="page-head">
            <div className="crumbs">
              <Link to="/colmenas" className="crumb-link">← Volver a Colmenas</Link>
              {colmena?.nombre && <span className="crumb-current">{colmena.nombre}</span>}
            </div>
            {colmena?.apiario && (
              <span className="badge-apiario-head">📍 {colmena.apiario}</span>
            )}
          </div>

          {/* Chips info */}
          <div className="info-grid">
            <InfoChip icon={<FaBalanceScale />} title="Colmena" value={colmena?.nombre} />
            <InfoChip icon={<FaMapMarkerAlt />} title="Apiario" value={colmena?.apiario} />
          </div>

          {/* ====== SLAB NEGRO: KPI + GRÁFICAS ====== */}
          <div className="reading-slab">
            {/* KPI de peso */}
            <KpiCard
              label="Peso actual"
              value={pesoActual}
              delta={variacion}
              date={ultimaFechaFmt}
            />

            {/* Grillas de gráficas */}
            <div className="charts-grid">
              <Panel title="Temperatura" icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto","auto"]}/>
                      <YAxis />
                      <Tooltip labelFormatter={formatFecha} />
                      <Legend />
                      <Line type="monotone" dataKey="temperatura" stroke="#8ea6ff" name="Temperatura (°C)" dot={false} strokeWidth={2}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyBox>Sin lecturas disponibles.</EmptyBox>
                )}
              </Panel>

              <Panel title="Humedad" icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto","auto"]}/>
                      <YAxis />
                      <Tooltip labelFormatter={formatFecha} />
                      <Legend />
                      <Line type="monotone" dataKey="humedad" stroke="#79d6b3" name="Humedad (%)" dot={false} strokeWidth={2}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyBox>Sin lecturas disponibles.</EmptyBox>
                )}
              </Panel>

              <Panel title="Peso" icon={<FaChartLine />}>
                {lecturas.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lecturas}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="fecha" type="number" tickFormatter={formatFecha} domain={["auto","auto"]}/>
                      <YAxis />
                      <Tooltip labelFormatter={formatFecha} />
                      <Legend />
                      <Line type="monotone" dataKey="peso" stroke="#ffc658" name="Peso (kg)" dot={false} strokeWidth={2}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyBox>Sin lecturas disponibles.</EmptyBox>
                )}
              </Panel>
            </div>
          </div>

          {/* Estados */}
          {loading && <div className="loading-note">Cargando datos de la colmena…</div>}
          {fail && (
            <div className="empty-box error">
              <h4>Ocurrió un problema</h4>
              <p>Verifica la API: <code>GET /api/colmenas/{id}/detalle</code></p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ColmenaDetallePage;
