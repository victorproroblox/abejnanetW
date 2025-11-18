// backend/routes/reportes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// Helpers
const rango = (desde, hasta) => [desde + " 00:00:00", hasta + " 23:59:59"];

/* =========================
   CATÁLOGOS BÁSICOS
========================= */
router.get("/apiarios", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, nombre FROM apiarios ORDER BY nombre"
  );
  res.json(rows);
});

router.get("/colmenas", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, apiario_id, nombre FROM colmenas ORDER BY nombre"
  );
  res.json(rows);
});

/* =========================
   OPERATIVO
========================= */
// KPIs (compatibles con MariaDB)
router.get("/resumen", async (req, res) => {
  const { desde, hasta, apiarioId, colmenaId } = req.query;
  const [from, to] = rango(desde, hasta);

  const params = [];
  let where = " WHERE 1=1 ";
  if (apiarioId) { where += " AND c.apiario_id = ? "; params.push(apiarioId); }
  if (colmenaId) { where += " AND c.id = ? "; params.push(colmenaId); }

  try {
    // 1) Colmenas activas con lecturas en el rango
    const [activas] = await pool.query(
      `
      SELECT COUNT(DISTINCT c.id) AS n
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
      JOIN colmenas c ON c.id = s.colmena_id
      ${where}
      AND l.fecha_registro BETWEEN ? AND ?
      `,
      [...params, from, to]
    );

    // 2) Promedio de peso en el rango
    const [prom] = await pool.query(
      `
      SELECT AVG(l.peso) AS prom
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
      JOIN colmenas c ON c.id = s.colmena_id
      ${where}
      AND l.fecha_registro BETWEEN ? AND ?
      `,
      [...params, from, to]
    );

    // 3) Variación promedio por colmena (último - primero del rango)
    //    Truco con GROUP_CONCAT para evitar CTE/ventanas
    const [var7] = await pool.query(
      `
      SELECT AVG(last_p - first_p) AS variacion
      FROM (
        SELECT
          c.id AS colmena_id,
          CAST(SUBSTRING_INDEX(GROUP_CONCAT(l.peso ORDER BY l.fecha_registro ASC), ',', 1) AS DECIMAL(10,3)) AS first_p,
          CAST(SUBSTRING_INDEX(GROUP_CONCAT(l.peso ORDER BY l.fecha_registro DESC), ',', 1) AS DECIMAL(10,3)) AS last_p
        FROM lecturas_ambientales l
        JOIN sensores s ON s.id = l.sensor_id
        JOIN colmenas c ON c.id = s.colmena_id
        ${where}
        AND l.fecha_registro BETWEEN ? AND ?
        GROUP BY c.id
      ) t
      `,
      [...params, from, to]
    );

    // 4) Alertas por caída brusca (≤ -1.5 kg) entre lecturas consecutivas
    //    Self-join con subconsulta (sin LATERAL)
    const [alertas] = await pool.query(
      `
      SELECT COUNT(*) AS n
      FROM (
        SELECT (l2.peso - l1.peso) AS delta
        FROM lecturas_ambientales l1
        JOIN sensores s1 ON s1.id = l1.sensor_id
        JOIN colmenas c ON c.id = s1.colmena_id
        JOIN lecturas_ambientales l2
          ON l2.sensor_id = s1.id
         AND l2.fecha_registro = (
              SELECT MIN(l3.fecha_registro)
              FROM lecturas_ambientales l3
              WHERE l3.sensor_id = s1.id
                AND l3.fecha_registro > l1.fecha_registro
            )
        ${where}
        AND l1.fecha_registro BETWEEN ? AND ?
      ) x
      WHERE delta <= -1.5
      `,
      [...params, from, to]
    );

    res.json({
      activas: activas[0]?.n || 0,
      promPeso: prom[0]?.prom || 0,
      variacion7d: var7[0]?.variacion || 0,
      alertas: alertas[0]?.n || 0,
    });
  } catch (e) {
    console.error("Error KPIs /resumen:", e);
    res.status(500).json({ error: e.message });
  }
});

// Serie de peso
router.get("/serie-peso", async (req, res) => {
  const { desde, hasta, apiarioId, colmenaId } = req.query;
  const [from, to] = rango(desde, hasta);
  const params = [];
  let where = " WHERE 1=1 ";

  if (apiarioId) { where += " AND c.apiario_id = ? "; params.push(apiarioId); }
  if (colmenaId) { where += " AND c.id = ? "; params.push(colmenaId); }

  const [rows] = await pool.query(
    `
    SELECT DATE_FORMAT(l.fecha_registro, '%Y-%m-%d %H:%i') AS fecha,
           c.nombre AS colmena, l.peso
    FROM lecturas_ambientales l
    JOIN sensores s ON s.id = l.sensor_id
    JOIN colmenas c ON c.id = s.colmena_id
    ${where} AND l.fecha_registro BETWEEN ? AND ?
    ORDER BY l.fecha_registro
    `,
    [...params, from, to]
  );
  res.json(rows);
});

// Serie ambiente (temp/humedad)
router.get("/serie-ambiente", async (req, res) => {
  const { desde, hasta, apiarioId, colmenaId } = req.query;
  const [from, to] = rango(desde, hasta);
  const params = [];
  let where = " WHERE 1=1 ";
  if (apiarioId) { where += " AND c.apiario_id = ? "; params.push(apiarioId); }
  if (colmenaId) { where += " AND c.id = ? "; params.push(colmenaId); }

  const [rows] = await pool.query(
    `
    SELECT DATE_FORMAT(l.fecha_registro, '%Y-%m-%d %H:%i') AS fecha,
           l.temperatura, l.humedad
    FROM lecturas_ambientales l
    JOIN sensores s ON s.id = l.sensor_id
    JOIN colmenas c ON c.id = s.colmena_id
    ${where} AND l.fecha_registro BETWEEN ? AND ?
    ORDER BY l.fecha_registro
    `,
    [...params, from, to]
  );
  res.json(rows);
});

/* =========================
   ADMIN: USUARIOS
========================= */
// KPIs + por rol (con rango para altas)
router.get("/usuarios/resumen", async (req, res) => {
  const { desde, hasta } = req.query;
  const [from, to] = rango(desde, hasta);

  const [[tot]]   = await pool.query("SELECT COUNT(*) AS total FROM usuarios");
  const [[act]]   = await pool.query("SELECT COUNT(*) AS activos FROM usuarios WHERE esta_activo = 1");
  const [[inact]] = await pool.query("SELECT COUNT(*) AS inactivos FROM usuarios WHERE esta_activo = 0");
  const [porRol]  = await pool.query(`
    SELECT r.nombre AS rol, COUNT(*) AS cantidad
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    GROUP BY r.id, r.nombre
    ORDER BY cantidad DESC
  `);

  res.json({
    total: tot.total,
    activos: act.activos,
    inactivos: inact.inactivos,
    porRol,
  });
});

// Altas por mes (en rango)
router.get("/usuarios/crecimiento", async (req, res) => {
  const { desde, hasta } = req.query;
  const [from, to] = rango(desde, hasta);
  const [rows] = await pool.query(
    `
    SELECT DATE_FORMAT(fecha_creacion, '%Y-%m') AS mes, COUNT(*) AS altas
    FROM usuarios
    WHERE fecha_creacion BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m')
    ORDER BY mes
    `,
    [from, to]
  );
  res.json(rows);
});

// Listado (puedes paginar luego)
router.get("/usuarios/listado", async (_req, res) => {
  const [rows] = await pool.query(
    `
    SELECT u.id, u.nombre, u.apellido_paterno, u.correo_electronico,
           u.esta_activo, DATE_FORMAT(u.fecha_creacion,'%Y-%m-%d %H:%i') AS fecha_creacion,
           r.nombre AS rol
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    ORDER BY u.fecha_creacion DESC
    LIMIT 100
    `
  );
  res.json(rows);
});

/* =========================
   ADMIN: COLMENAS
========================= */
router.get("/colmenas/resumen", async (_req, res) => {
  const [[tot]] = await pool.query("SELECT COUNT(*) AS total FROM colmenas");
  const [[conS]] = await pool.query(
    "SELECT COUNT(DISTINCT colmena_id) AS n FROM sensores WHERE colmena_id IS NOT NULL"
  );
  const [[sinS]] = await pool.query(
    "SELECT COUNT(*) AS n FROM colmenas WHERE id NOT IN (SELECT DISTINCT colmena_id FROM sensores WHERE colmena_id IS NOT NULL)"
  );
  // activas últimos 7 días (con lecturas)
  const [act7] = await pool.query(
    `
    SELECT COUNT(DISTINCT c.id) AS n
    FROM lecturas_ambientales l
    JOIN sensores s ON s.id = l.sensor_id
    JOIN colmenas c ON c.id = s.colmena_id
    WHERE l.fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `
  );
  res.json({
    total: tot.total,
    con_sensor: conS.n,
    sin_sensor: sinS.n,
    activas_7d: act7[0]?.n || 0,
  });
});

router.get("/colmenas/por-apiario", async (_req, res) => {
  const [rows] = await pool.query(
    `
    SELECT a.nombre AS apiario, COUNT(*) AS colmenas
    FROM colmenas c
    JOIN apiarios a ON a.id = c.apiario_id
    GROUP BY a.id, a.nombre
    ORDER BY colmenas DESC
    `
  );
  res.json(rows);
});

/* =========================
   ADMIN: APIARIOS
========================= */
router.get("/apiarios/resumen-admin", async (_req, res) => {
  const [[api]] = await pool.query("SELECT COUNT(*) AS n FROM apiarios");
  const [[col]] = await pool.query("SELECT COUNT(*) AS n FROM colmenas");
  const [[sen]] = await pool.query("SELECT COUNT(*) AS n FROM sensores");
  const [[lec7]] = await pool.query(
    "SELECT COUNT(*) AS n FROM lecturas_ambientales WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  );
  res.json({
    apiarios: api.n,
    colmenas: col.n,
    sensores: sen.n,
    lecturas_7d: lec7.n,
  });
});

router.get("/apiarios/top-actividad", async (req, res) => {
  const { desde, hasta } = req.query;
  const [from, to] = rango(desde, hasta);
  const [rows] = await pool.query(
    `
    SELECT a.nombre AS apiario, COUNT(*) AS lecturas
    FROM lecturas_ambientales l
    JOIN sensores s ON s.id = l.sensor_id
    JOIN colmenas c ON c.id = s.colmena_id
    JOIN apiarios a ON a.id = c.apiario_id
    WHERE l.fecha_registro BETWEEN ? AND ?
    GROUP BY a.id, a.nombre
    ORDER BY lecturas DESC
    `,
    [from, to]
  );
  res.json(rows);
});

module.exports = router;
 