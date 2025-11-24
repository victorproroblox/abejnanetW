import React, { useEffect, useMemo, useState, useRef } from "react";
import "./ReportesPage.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/abeja_logo.png";

/* ================== HELPERS CSV ================== */
const toCSV = (rows) => {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  return [headers.join(","), ...lines].join("\n");
};

const downloadCSV = (rows, name = "reporte.csv") => {
  if (!rows?.length) {
    alert("No hay datos para exportar.");
    return;
  }
  const blob = new Blob([toCSV(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

/* ================== UI COMPONENTES ================== */

// KPI Card
const KPICard = ({ title, value, subtitle, icon }) => (
  <div className="kpi-card">
    <div className="kpi-header">
      <span className="kpi-icon">{icon}</span>
      <span className="kpi-title">{title}</span>
    </div>
    <div className="kpi-value">{value}</div>
    {subtitle && <div className="kpi-sub">{subtitle}</div>}
  </div>
);

// Tabs
const Tabs = ({ tab, setTab }) => (
  <div className="tabs">
    {["Operativo", "Usuarios", "Colmenas", "Apiarios"].map((t) => (
      <button
        key={t}
        className={`tab-btn ${tab === t ? "active" : ""}`}
        onClick={() => setTab(t)}
      >
        {t}
      </button>
    ))}
  </div>
);

// Filtros
const Filtros = ({ apiarios, colmenas, filtros, setFiltros }) => {
  return (
    <div className="filter-bar">
      <div>
        <label>Desde</label>
        <input
          type="date"
          value={filtros.desde}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, desde: e.target.value }))
          }
        />
      </div>
      <div>
        <label>Hasta</label>
        <input
          type="date"
          value={filtros.hasta}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, hasta: e.target.value }))
          }
        />
      </div>
      <div>
        <label>Apiario</label>
        <select
          value={filtros.apiarioId || ""}
          onChange={(e) =>
            setFiltros((f) => ({
              ...f,
              apiarioId: e.target.value || null,
              colmenaId: null,
            }))
          }
        >
          <option value="">Todos</option>
          {apiarios.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Colmena</label>
        <select
          value={filtros.colmenaId || ""}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, colmenaId: e.target.value || null }))
          }
        >
          <option value="">Todas</option>
          {colmenas
            .filter(
              (c) =>
                !filtros.apiarioId ||
                String(c.apiario_id) === String(filtros.apiarioId)
            )
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
        </select>
      </div>
      <div className="filter-help">
        <p>
          Tip: filtra por apiario/colmena para ver sólo las lecturas
          relevantes al rango de fechas seleccionado.
        </p>
      </div>
    </div>
  );
};

/* ================== PÁGINA ================== */

export default function ReportesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // usuario
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const email = usuario?.correo_electronico || "Invitado";
  const nombre = usuario?.nombre || "Apicultor";

  const initials = useMemo(() => {
    const base = (email || "U").trim();
    return base.slice(0, 2).toUpperCase();
  }, [email]);

  const navItems = [
    { to: "/dashboard", label: "Inicio", icon: "🏠" },
    { to: "/colmenas", label: "Colmenas", icon: "🐝" },
    { to: "/reportes", label: "Reportes", icon: "📄" },
    { to: "/sensores", label: "Sensores", icon: "📡" },
    { to: "/cuenta", label: "Cuenta", icon: "👤" },
  ];

  // pestaña actual
  const [tab, setTab] = useState("Operativo");
  const [loading, setLoading] = useState(true);

  // catálogos
  const [apiarios, setApiarios] = useState([]);
  const [colmenas, setColmenas] = useState([]);

  // operativo
  const [kpis, setKpis] = useState({
    activas: 0,
    promPeso: 0,
    variacion7d: 0,
    alertas: 0,
  });
  const [seriePeso, setSeriePeso] = useState([]);
  const [serieAmb, setSerieAmb] = useState([]);
  const [topVariacion, setTopVariacion] = useState([]);
  const [eventos, setEventos] = useState([]);

  // usuarios
  const [usrResumen, setUsrResumen] = useState(null);
  const [usrCrec, setUsrCrec] = useState([]);
  const [usrList, setUsrList] = useState([]);

  // colmenas
  const [colmResumen, setColmResumen] = useState(null);
  const [colmPorApiario, setColmPorApiario] = useState([]);
  const [colmSinLect, setColmSinLect] = useState([]);

  // apiarios
  const [apiResumen, setApiResumen] = useState(null);
  const [apiTopAct, setApiTopAct] = useState([]);

  // filtros
  const today = dayjs().format("YYYY-MM-DD");
  const weekAgo = dayjs().subtract(7, "day").format("YYYY-MM-DD");
  const [filtros, setFiltros] = useState({
    desde: weekAgo,
    hasta: today,
    apiarioId: null,
    colmenaId: null,
  });

  // para exportar PDF
  const dashRef = useRef(null);

  /* ========== FETCH BASE ========== */
  const fetchBase = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text || url}`);
    }
    return res.json();
  };

  /* ========== PDF ========== */
  const loadImageAsDataURL = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = src;
    });

  const exportPDF = async () => {
    try {
      const el = dashRef.current;
      if (!el) return;

      const logoData = await loadImageAsDataURL("/logo.png").catch(() => null);

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const pdf = new jsPDF("landscape", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;

      if (logoData) pdf.addImage(logoData, "PNG", margin, 16, 48, 48);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(
        `AbejaNet — Reporte ${tab}`,
        logoData ? margin + 60 : margin,
        34
      );
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(
        `Rango: ${filtros.desde}  a  ${filtros.hasta}`,
        logoData ? margin + 60 : margin,
        52
      );

      const availW = pageW - margin * 2;
      const availH = pageH - 90;
      const ratio = Math.min(availW / canvas.width, availH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageW - imgW) / 2;
      const y = 70;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
      pdf.save(`AbejaNet_${tab}_${filtros.desde}_${filtros.hasta}.pdf`);
    } catch (e) {
      console.error(e);
      alert(`No se pudo exportar el PDF\n${e.message}`);
    }
  };

  /* ========== CARGAS ========== */

  const cargarCatalogos = async () => {
    const [a, c] = await Promise.all([
      fetchBase(
        "https://abejanet-backend-cplf.onrender.com/api/reportes/apiarios"
      ),
      fetchBase(
        "https://abejanet-backend-cplf.onrender.com/api/reportes/colmenas"
      ),
    ]);
    setApiarios(a);
    setColmenas(c);
  };

  const cargarOperativo = async () => {
    const qs = new URLSearchParams({
      desde: filtros.desde,
      hasta: filtros.hasta,
      ...(filtros.apiarioId ? { apiarioId: filtros.apiarioId } : {}),
      ...(filtros.colmenaId ? { colmenaId: filtros.colmenaId } : {}),
    }).toString();

    const [resumen, peso, amb] = await Promise.all([
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/resumen?${qs}`
      ),
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/serie-peso?${qs}`
      ),
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/serie-ambiente?${qs}`
      ).catch(() => []),
    ]);

    setKpis(resumen);
    setSeriePeso(peso);
    setSerieAmb(amb);
    setTopVariacion([]); // puedes llenarlo cuando tengas el endpoint
    setEventos([]);
  };

  const cargarUsuarios = async () => {
    const qs = new URLSearchParams({
      desde: filtros.desde,
      hasta: filtros.hasta,
    }).toString();
    const [r, m, l] = await Promise.all([
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/usuarios/resumen?${qs}`
      ),
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/usuarios/crecimiento?${qs}`
      ),
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/usuarios/listado`
      ),
    ]);
    setUsrResumen(r);
    setUsrCrec(m);
    setUsrList(l);
  };

  const cargarColmenasAdmin = async () => {
    const [r, p] = await Promise.all([
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/colmenas/resumen`
      ),
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/colmenas/por-apiario`
      ),
    ]);
    setColmResumen(r);
    setColmPorApiario(p);
    setColmSinLect([]);
  };

  const cargarApiariosAdmin = async () => {
    const qs = new URLSearchParams({
      desde: filtros.desde,
      hasta: filtros.hasta,
    }).toString();
    const [r, t] = await Promise.all([
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/apiarios/resumen-admin`
      ),
      fetchBase(
        `https://abejanet-backend-cplf.onrender.com/api/reportes/apiarios/top-actividad?${qs}`
      ),
    ]);
    setApiResumen(r);
    setApiTopAct(t);
  };

  // init
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await cargarCatalogos();
        await cargarOperativo();
      } catch (e) {
        console.error("Error init:", e);
        alert(`Error inicializando\n${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cada que cambie de tab o filtros, recarga lo necesario
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (tab === "Operativo") await cargarOperativo();
        if (tab === "Usuarios") await cargarUsuarios();
        if (tab === "Colmenas") await cargarColmenasAdmin();
        if (tab === "Apiarios") await cargarApiariosAdmin();
      } catch (e) {
        console.error("Error al cargar", e);
        alert(`Error cargando ${tab}\n${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filtros.desde, filtros.hasta, filtros.apiarioId, filtros.colmenaId]);

  // agrupar serie de peso por colmena
  const pesoPorColmena = useMemo(() => {
    const map = {};
    for (const r of seriePeso) {
      map[r.colmena] = map[r.colmena] || [];
      map[r.colmena].push(r);
    }
    return map;
  }, [seriePeso]);

  // acciones por tab
  const actionsOperativo = (
    <>
      <button
        onClick={() => downloadCSV(seriePeso, "serie_peso.csv")}
        className="btn-outline"
      >
        Peso CSV
      </button>
      <button
        onClick={() => downloadCSV(serieAmb, "serie_ambiente.csv")}
        className="btn-outline"
      >
        Ambiente CSV
      </button>
      <button
        onClick={() => downloadCSV(eventos, "eventos.csv")}
        className="btn-outline"
      >
        Eventos CSV
      </button>
      <button onClick={exportPDF} className="btn-primary">
        Exportar PDF
      </button>
    </>
  );

  const actionsUsuarios = (
    <>
      <button
        onClick={() => downloadCSV(usrList, "usuarios.csv")}
        className="btn-outline"
      >
        Usuarios CSV
      </button>
      <button
        onClick={() => downloadCSV(usrCrec, "usuarios_altas_por_mes.csv")}
        className="btn-outline"
      >
        Altas por mes CSV
      </button>
      <button
        onClick={() =>
          downloadCSV(usrResumen?.porRol || [], "usuarios_por_rol.csv")
        }
        className="btn-outline"
      >
        Usuarios por rol CSV
      </button>
      <button onClick={exportPDF} className="btn-primary">
        Exportar PDF
      </button>
    </>
  );

  const actionsColmenas = (
    <>
      <button
        onClick={() =>
          downloadCSV(colmPorApiario, "colmenas_por_apiario.csv")
        }
        className="btn-outline"
      >
        Colmenas CSV
      </button>
      <button onClick={exportPDF} className="btn-primary">
        Exportar PDF
      </button>
    </>
  );

  const actionsApiarios = (
    <>
      <button
        onClick={() => downloadCSV(apiTopAct, "apiarios_top_actividad.csv")}
        className="btn-outline"
      >
        Actividad CSV
      </button>
      <button onClick={exportPDF} className="btn-primary">
        Exportar PDF
      </button>
    </>
  );

  return (
    <div className="reportes-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="reportes-sidebar">
        <div
          className="reportes-logo"
          onClick={() => navigate("/dashboard")}
          title="Ir al inicio"
        >
          <img src={logo} alt="AbejaNet" className="reportes-logo-img" />
          <span className="reportes-logo-text">AbejaNet</span>
        </div>

        <nav className="reportes-nav">
          {navItems.map((item) => (
            <button
              key={item.to}
              className={
                "reportes-nav-item" +
                (location.pathname === item.to
                  ? " reportes-nav-item-active"
                  : "")
              }
              onClick={() => navigate(item.to)}
            >
              <span className="reportes-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="reportes-sidebar-footer" title={email}>
          <div className="reportes-user-initials">{initials}</div>
          <div className="reportes-user-meta">
            <span className="reportes-user-name">
              {nombre.split(" ")[0] || "Usuario"}
            </span>
            <span className="reportes-user-email">{email}</span>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="reportes-main">
        <div className="reportes-root">
          <header className="reportes-title">
            <div>
              <p className="reportes-badge">Módulo de análisis</p>
              <h1>Reportes y analítica</h1>
              <p className="reportes-subtitle">
                Explora la actividad de tus colmenas, usuarios y apiarios en el
                rango de fechas seleccionado. Puedes exportar la vista actual a
                CSV o PDF para tus evidencias.
              </p>
            </div>
            <div className="actions">
              {tab === "Operativo" && actionsOperativo}
              {tab === "Usuarios" && actionsUsuarios}
              {tab === "Colmenas" && actionsColmenas}
              {tab === "Apiarios" && actionsApiarios}
            </div>
          </header>

          <Tabs tab={tab} setTab={setTab} />

          {/* Contenido exportable */}
          <div ref={dashRef}>
            <Filtros
              apiarios={apiarios}
              colmenas={colmenas}
              filtros={filtros}
              setFiltros={setFiltros}
            />

            {loading ? (
              <div className="loader">Cargando…</div>
            ) : (
              <>
                {/* ===== OPERATIVO ===== */}
                {tab === "Operativo" && (
                  <>
                    <div className="kpi-grid">
                      <KPICard
                        title="Colmenas activas"
                        value={kpis.activas}
                        subtitle="Con lecturas recientes"
                        icon="🟢"
                      />
                      <KPICard
                        title="Prom. peso"
                        value={`${
                          kpis.promPeso?.toFixed?.(1) ?? kpis.promPeso
                        } kg`}
                        subtitle="Peso promedio del rango"
                        icon="⚖️"
                      />
                      <KPICard
                        title="Variación 7 días"
                        value={`${
                          kpis.variacion7d?.toFixed?.(1) ?? kpis.variacion7d
                        } kg`}
                        subtitle="Tendencia de la última semana"
                        icon="📈"
                      />
                      <KPICard
                        title="Alertas"
                        value={kpis.alertas}
                        subtitle="Caídas de peso / inactividad"
                        icon="🚨"
                      />
                    </div>

                    <div className="grid-2">
                      <div className="panel">
                        <div className="panel-title">
                          Tendencia de peso por colmena
                        </div>
                        <p className="panel-help">
                          Cada línea corresponde a una colmena. Úsalo para
                          detectar cambios de peso inusuales.
                        </p>
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="fecha"
                              type="category"
                              allowDuplicatedCategory={false}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {Object.entries(pesoPorColmena).map(
                              ([colmena, data]) => (
                                <Line
                                  key={colmena}
                                  data={data}
                                  dataKey="peso"
                                  name={colmena}
                                  type="monotone"
                                  dot={false}
                                />
                              )
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="panel">
                        <div className="panel-title">
                          Ambiente (temperatura / humedad)
                        </div>
                        <p className="panel-help">
                          Relación entre temperatura y humedad interna de las
                          colmenas monitoreadas.
                        </p>
                        <ResponsiveContainer width="100%" height={320}>
                          <AreaChart data={serieAmb}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey="temperatura"
                              name="Temp (°C)"
                            />
                            <Area
                              yAxisId="right"
                              type="monotone"
                              dataKey="humedad"
                              name="Humedad (%)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="panel">
                        <div className="panel-title">
                          Top variación de peso
                        </div>
                        <p className="panel-help">
                          Colmenas con mayor ganancia o pérdida de peso en el
                          periodo. Ideal para decidir inspecciones físicas.
                        </p>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={topVariacion}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="colmena" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="variacion"
                              name="Variación (kg)"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="panel">
                        <div className="panel-title">Eventos / Alertas</div>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Colmena</th>
                                <th>Tipo</th>
                                <th>Detalle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eventos.map((e, i) => (
                                <tr key={i}>
                                  <td>{e.fecha}</td>
                                  <td>{e.colmena}</td>
                                  <td>{e.tipo}</td>
                                  <td>{e.detalle}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== USUARIOS ===== */}
                {tab === "Usuarios" && (
                  <>
                    {usrResumen && (
                      <div className="kpi-grid">
                        <KPICard
                          title="Usuarios totales"
                          value={usrResumen.total}
                          icon="👥"
                        />
                        <KPICard
                          title="Activos"
                          value={usrResumen.activos}
                          icon="✅"
                          subtitle="Con acceso al sistema"
                        />
                        <KPICard
                          title="Inactivos"
                          value={usrResumen.inactivos}
                          icon="⏸️"
                        />
                        <KPICard
                          title="Roles definidos"
                          value={usrResumen?.porRol?.length || 0}
                          icon="🧩"
                        />
                      </div>
                    )}

                    <div className="grid-2">
                      <div className="panel">
                        <div className="panel-title">Altas por mes</div>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={usrCrec}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="altas" name="Altas" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="panel">
                        <div className="panel-title">Usuarios por rol</div>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Rol</th>
                                <th>Cantidad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(usrResumen?.porRol || []).map((r, i) => (
                                <tr key={i}>
                                  <td>{r.rol}</td>
                                  <td>{r.cantidad}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="panel">
                      <div className="panel-title">
                        Listado de usuarios (recientes)
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Correo</th>
                              <th>Rol</th>
                              <th>Activo</th>
                              <th>Creación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usrList.map((u) => (
                              <tr key={u.id}>
                                <td>
                                  {[u.nombre, u.apellido_paterno]
                                    .filter(Boolean)
                                    .join(" ")}
                                </td>
                                <td>{u.correo_electronico}</td>
                                <td>{u.rol}</td>
                                <td>{u.esta_activo ? "Sí" : "No"}</td>
                                <td>{u.fecha_creacion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== COLMENAS ===== */}
                {tab === "Colmenas" && (
                  <>
                    {colmResumen && (
                      <div className="kpi-grid">
                        <KPICard
                          title="Colmenas"
                          value={colmResumen.total}
                          icon="🍯"
                        />
                        <KPICard
                          title="Con sensor"
                          value={colmResumen.con_sensor}
                          icon="🧭"
                        />
                        <KPICard
                          title="Sin sensor"
                          value={colmResumen.sin_sensor}
                          icon="❔"
                        />
                        <KPICard
                          title="Activas (7d)"
                          value={colmResumen.activas_7d}
                          icon="⚡"
                        />
                      </div>
                    )}

                    <div className="panel">
                      <div className="panel-title">Colmenas por apiario</div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Apiario</th>
                              <th>Colmenas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {colmPorApiario.map((a, i) => (
                              <tr key={i}>
                                <td>{a.apiario}</td>
                                <td>{a.colmenas}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== APIARIOS ===== */}
                {tab === "Apiarios" && (
                  <>
                    {apiResumen && (
                      <div className="kpi-grid">
                        <KPICard
                          title="Apiarios"
                          value={apiResumen.apiarios}
                          icon="🏷️"
                        />
                        <KPICard
                          title="Colmenas"
                          value={apiResumen.colmenas}
                          icon="🍯"
                        />
                        <KPICard
                          title="Sensores"
                          value={apiResumen.sensores}
                          icon="🧭"
                        />
                        <KPICard
                          title="Lecturas (7d)"
                          value={apiResumen.lecturas_7d}
                          icon="📥"
                        />
                      </div>
                    )}

                    <div className="panel">
                      <div className="panel-title">
                        Top actividad por apiario
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Apiario</th>
                              <th>Lecturas en rango</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apiTopAct.map((r, i) => (
                              <tr key={i}>
                                <td>{r.apiario}</td>
                                <td>{r.lecturas}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
