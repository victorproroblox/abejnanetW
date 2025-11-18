import React, { useEffect, useMemo, useState, useRef } from "react";
import "./ReportesPage.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, BarChart, Bar
} from "recharts";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// CSV helpers
const toCSV = (rows) => {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
  return [headers.join(","), ...lines].join("\n");
};
const downloadCSV = (rows, name="reporte.csv") => {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

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
    {["Operativo", "Usuarios", "Colmenas", "Apiarios"].map(t => (
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

// Filtros (se usan en Operativo; en admin solo usamos fechas para algunos)
const Filtros = ({ apiarios, colmenas, filtros, setFiltros, onBuscar }) => {
  return (
    <div className="filter-bar">
      <div>
        <label>Desde</label>
        <input
          type="date"
          value={filtros.desde}
          onChange={(e) => setFiltros(f => ({ ...f, desde: e.target.value }))}
        />
      </div>
      <div>
        <label>Hasta</label>
        <input
          type="date"
          value={filtros.hasta}
          onChange={(e) => setFiltros(f => ({ ...f, hasta: e.target.value }))}
        />
      </div>
      <div>
        <label>Apiario</label>
        <select
          value={filtros.apiarioId || ""}
          onChange={(e) => setFiltros(f => ({ ...f, apiarioId: e.target.value || null, colmenaId: null }))}
        >
          <option value="">Todos</option>
          {apiarios.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>
      <div>
        <label>Colmena</label>
        <select
          value={filtros.colmenaId || ""}
          onChange={(e) => setFiltros(f => ({ ...f, colmenaId: e.target.value || null }))}
        >
          <option value="">Todas</option>
          {colmenas
            .filter(c => !filtros.apiarioId || String(c.apiario_id) === String(filtros.apiarioId))
            .map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <button className="btn-primary" onClick={onBuscar}>Aplicar</button>
    </div>
  );
};

export default function ReportesPage() {
  // pestaña actual
  const [tab, setTab] = useState("Operativo");

  // loading general
  const [loading, setLoading] = useState(true);

  // catálogos
  const [apiarios, setApiarios] = useState([]);
  const [colmenas, setColmenas] = useState([]);

  // operativo
  const [kpis, setKpis] = useState({ activas: 0, promPeso: 0, variacion7d: 0, alertas: 0 });
  const [seriePeso, setSeriePeso] = useState([]);
  const [serieAmb, setSerieAmb] = useState([]);
  const [topVariacion, setTopVariacion] = useState([]);
  const [eventos, setEventos] = useState([]);

  // admin - usuarios
  const [usrResumen, setUsrResumen] = useState(null);
  const [usrCrec, setUsrCrec] = useState([]);
  const [usrList, setUsrList] = useState([]);

  // admin - colmenas
  const [colmResumen, setColmResumen] = useState(null);
  const [colmPorApiario, setColmPorApiario] = useState([]);
  const [colmSinLect, setColmSinLect] = useState([]); // (si lo agregas después)

  // admin - apiarios
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

  // PDF: capturamos la pestaña visible
  const dashRef = useRef(null);

  // fetch robusto
  const fetchBase = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text || url}`);
    }
    return res.json();
  };

  // PDF helpers
  const loadImageAsDataURL = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
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

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      const pdf = new jsPDF("landscape", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;

      if (logoData) pdf.addImage(logoData, "PNG", margin, 16, 48, 48);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(`AbejaNet — Reporte ${tab}`, logoData ? margin + 60 : margin, 34);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(`Rango: ${filtros.desde}  a  ${filtros.hasta}`, logoData ? margin + 60 : margin, 52);

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

  // ======= CARGAS =======
  const cargarCatalogos = async () => {
    const [a, c] = await Promise.all([
      fetchBase("/api/reportes/apiarios"),
      fetchBase("/api/reportes/colmenas"),
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
      fetchBase(`/api/reportes/resumen?${qs}`),
      fetchBase(`/api/reportes/serie-peso?${qs}`),
      // tienes implementado serie-ambiente/top-variacion/eventos en tu versión anterior; si no, no rompen
      fetchBase(`/api/reportes/serie-ambiente?${qs}`).catch(() => []),
    ]);

    setKpis(resumen);
    setSeriePeso(peso);
    setSerieAmb(amb);
    // si no tienes estos aún, déjalos vacíos
    setTopVariacion([]); 
    setEventos([]);
  };

  const cargarUsuarios = async () => {
    const qs = new URLSearchParams({ desde: filtros.desde, hasta: filtros.hasta }).toString();
    const [r, m, l] = await Promise.all([
      fetchBase(`/api/reportes/usuarios/resumen?${qs}`),
      fetchBase(`/api/reportes/usuarios/crecimiento?${qs}`),
      fetchBase(`/api/reportes/usuarios/listado`),
    ]);
    setUsrResumen(r);
    setUsrCrec(m);
    setUsrList(l);
  };

  const cargarColmenasAdmin = async () => {
    const [r, p] = await Promise.all([
      fetchBase(`/api/reportes/colmenas/resumen`),
      fetchBase(`/api/reportes/colmenas/por-apiario`),
    ]);
    setColmResumen(r);
    setColmPorApiario(p);
    setColmSinLect([]); // si implementas /sin-lecturas, lo llenas aquí
  };

  const cargarApiariosAdmin = async () => {
    const qs = new URLSearchParams({ desde: filtros.desde, hasta: filtros.hasta }).toString();
    const [r, t] = await Promise.all([
      fetchBase(`/api/reportes/apiarios/resumen-admin`),
      fetchBase(`/api/reportes/apiarios/top-actividad?${qs}`),
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

  // cada que cambie de tab o rangos, cargamos lo correspondiente
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

  // agrupación para serie de peso
  const pesoPorColmena = useMemo(() => {
    const map = {};
    for (const r of seriePeso) {
      map[r.colmena] = map[r.colmena] || [];
      map[r.colmena].push(r);
    }
    return map;
  }, [seriePeso]);

  // acciones por tab (CSV)
  const actionsOperativo = (
    <>
      <button onClick={() => downloadCSV(seriePeso, "serie_peso.csv")} className="btn-outline">Exportar Peso CSV</button>
      <button onClick={() => downloadCSV(serieAmb, "serie_ambiente.csv")} className="btn-outline">Exportar Ambiente CSV</button>
      <button onClick={() => downloadCSV(eventos, "eventos.csv")} className="btn-outline">Exportar Eventos CSV</button>
      <button onClick={exportPDF} className="btn-primary">Exportar PDF</button>
    </>
  );
  const actionsUsuarios = (
    <>
      <button onClick={() => downloadCSV(usrList, "usuarios.csv")} className="btn-outline">Exportar Usuarios CSV</button>
      <button onClick={() => downloadCSV(usrCrec, "usuarios_altas_por_mes.csv")} className="btn-outline">Exportar Altas CSV</button>
      <button onClick={() => downloadCSV(usrResumen?.porRol || [], "usuarios_por_rol.csv")} className="btn-outline">Exportar Por Rol CSV</button>
      <button onClick={exportPDF} className="btn-primary">Exportar PDF</button>
    </>
  );
  const actionsColmenas = (
    <>
      <button onClick={() => downloadCSV(colmPorApiario, "colmenas_por_apiario.csv")} className="btn-outline">Exportar CSV</button>
      <button onClick={exportPDF} className="btn-primary">Exportar PDF</button>
    </>
  );
  const actionsApiarios = (
    <>
      <button onClick={() => downloadCSV(apiTopAct, "apiarios_top_actividad.csv")} className="btn-outline">Exportar CSV</button>
      <button onClick={exportPDF} className="btn-primary">Exportar PDF</button>
    </>
  );

  return (
    <div className="reportes-root">
      <div className="reportes-title">
        <h1>Reportes</h1>
        {/* acciones por pestaña */}
        <div className="actions">
          {tab === "Operativo" && actionsOperativo}
          {tab === "Usuarios"  && actionsUsuarios}
          {tab === "Colmenas"  && actionsColmenas}
          {tab === "Apiarios"  && actionsApiarios}
        </div>
      </div>

      <Tabs tab={tab} setTab={setTab} />

      {/* Lo que se exporta a PDF es el contenedor actual */}
      <div ref={dashRef}>
        {/* Filtros siempre visibles (sirven sobre todo a Operativo y a algunos admin) */}
        <Filtros
          apiarios={apiarios}
          colmenas={colmenas}
          filtros={filtros}
          setFiltros={setFiltros}
          onBuscar={() => { /* ya recarga por useEffect */ }}
        />

        {loading ? (
          <div className="loader">Cargando…</div>
        ) : (
          <>
            {/* ========= OPERATIVO ========= */}
            {tab === "Operativo" && (
              <>
                <div className="kpi-grid">
                  <KPICard title="Colmenas activas" value={kpis.activas} subtitle="Con lecturas recientes" icon="🟢" />
                  <KPICard title="Prom. peso" value={`${kpis.promPeso?.toFixed?.(1) ?? kpis.promPeso} kg`} subtitle="Peso actual promedio" icon="⚖️" />
                  <KPICard title="Variación 7d" value={`${kpis.variacion7d?.toFixed?.(1) ?? kpis.variacion7d} kg`} subtitle="Sube/baja última semana" icon="📈" />
                  <KPICard title="Alertas" value={kpis.alertas} subtitle="Caídas bruscas/ inactividad" icon="🚨" />
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-title">Tendencia de peso por colmena</div>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" type="category" allowDuplicatedCategory={false} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {Object.entries(pesoPorColmena).map(([colmena, data]) => (
                          <Line key={colmena} data={data} dataKey="peso" name={colmena} type="monotone" dot={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel">
                    <div className="panel-title">Ambiente (temperatura / humedad)</div>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={serieAmb}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="temperatura" name="Temp (°C)" />
                        <Area yAxisId="right" type="monotone" dataKey="humedad" name="Humedad (%)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-title">Top variación de peso</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topVariacion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="colmena" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="variacion" name="Variación (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel">
                    <div className="panel-title">Eventos / Alertas</div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th><th>Colmena</th><th>Tipo</th><th>Detalle</th>
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

            {/* ========= USUARIOS ========= */}
            {tab === "Usuarios" && (
              <>
                {usrResumen && (
                  <div className="kpi-grid">
                    <KPICard title="Usuarios" value={usrResumen.total} icon="👥" />
                    <KPICard title="Activos" value={usrResumen.activos} icon="✅" />
                    <KPICard title="Inactivos" value={usrResumen.inactivos} icon="⏸️" />
                    <KPICard title="Roles" value={usrResumen?.porRol?.length || 0} icon="🧩" />
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
                        <thead><tr><th>Rol</th><th>Cantidad</th></tr></thead>
                        <tbody>
                          {(usrResumen?.porRol || []).map((r, i) => (
                            <tr key={i}><td>{r.rol}</td><td>{r.cantidad}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">Listado (recientes)</div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Nombre</th><th>Correo</th><th>Rol</th><th>Activo</th><th>Creación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usrList.map(u => (
                          <tr key={u.id}>
                            <td>{[u.nombre, u.apellido_paterno].filter(Boolean).join(" ")}</td>
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

            {/* ========= COLMENAS ========= */}
            {tab === "Colmenas" && (
              <>
                {colmResumen && (
                  <div className="kpi-grid">
                    <KPICard title="Colmenas" value={colmResumen.total} icon="🍯" />
                    <KPICard title="Con sensor" value={colmResumen.con_sensor} icon="🧭" />
                    <KPICard title="Sin sensor" value={colmResumen.sin_sensor} icon="❔" />
                    <KPICard title="Activas (7d)" value={colmResumen.activas_7d} icon="⚡" />
                  </div>
                )}

                <div className="panel">
                  <div className="panel-title">Colmenas por apiario</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Apiario</th><th>Colmenas</th></tr></thead>
                      <tbody>
                        {colmPorApiario.map((a, i) => (
                          <tr key={i}><td>{a.apiario}</td><td>{a.colmenas}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ========= APIARIOS ========= */}
            {tab === "Apiarios" && (
              <>
                {apiResumen && (
                  <div className="kpi-grid">
                    <KPICard title="Apiarios" value={apiResumen.apiarios} icon="🏷️" />
                    <KPICard title="Colmenas" value={apiResumen.colmenas} icon="🍯" />
                    <KPICard title="Sensores" value={apiResumen.sensores} icon="🧭" />
                    <KPICard title="Lecturas (7d)" value={apiResumen.lecturas_7d} icon="📥" />
                  </div>
                )}

                <div className="panel">
                  <div className="panel-title">Top actividad (por lecturas en rango)</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Apiario</th><th>Lecturas</th></tr></thead>
                      <tbody>
                        {apiTopAct.map((r, i) => (
                          <tr key={i}><td>{r.apiario}</td><td>{r.lecturas}</td></tr>
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
  );
}
