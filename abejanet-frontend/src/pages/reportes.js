const express = require("express");
const router = express.Router();
const pool = require("../db"); // conexión MariaDB

// 🕐 Helper para rangos
const rango = (desde, hasta) => [desde + " 00:00:00", hasta + " 23:59:59"];

// ========================================================
// 🐝 REPORTES OPERATIVOS (ya existentes, sin cambios)
// ========================================================
router.get("/apiarios", async (req, res) => {
  const [rows] = await pool.query("SELECT id, nombre FROM apiarios ORDER BY nombre");
  res.json(rows);
});

router.get("/colmenas", async (req, res) => {
  const [rows] = await pool.query("SELECT id, apiario_id, nombre FROM colmenas ORDER BY nombre");
  res.json(rows);
});

router.get("/resumen", async (req, res) => {
  const { desde, hasta, apiarioId, colmenaId } = req.query;
  const [from, to] = rango(desde, hasta);
  const params = [];
  let where = " WHERE 1=1 ";

  if (apiarioId) { where += " AND c.apiario_id = ? "; params.push(apiarioId); }
  if (colmenaId) { where += " AND c.id = ? "; params.push(colmenaId); }

  // Colmenas activas
  const [activas] = await pool.query(`
    SELECT COUNT(DISTINCT c.id) AS n
    FROM colmenas c
    JOIN lecturas_ambientales l ON l.colmena = c.id
    ${where} AND l.fecha_registro BETWEEN ? AND ?;
  `, [...params, from, to]);

  // Promedio peso
  const [prom] = await pool.query(`
    SELECT AVG(l.peso) AS prom
    FROM lecturas_ambientales l
    JOIN colmenas c ON c.id = l.colmena
    ${where} AND l.fecha_registro BETWEEN ? AND ?;
  `, [...params, from, to]);

  // Variación
  const [var7] = await pool.query(`
    SELECT AVG(fin.peso - ini.peso) AS variacion
    FROM (
      SELECT colmena, MIN(fecha_registro) AS fmin, MAX(fecha_registro) AS fmax
      FROM lecturas_ambientales l
      JOIN colmenas c ON c.id = l.colmena
      ${where} AND l.fecha_registro BETWEEN ? AND ?
      GROUP BY colmena
    ) t
    JOIN lecturas_ambientales ini ON ini.colmena = t.colmena AND ini.fecha_registro = t.fmin
    JOIN lecturas_ambientales fin ON fin.colmena = t.colmena AND fin.fecha_registro = t.fmax;
  `, [...params, from, to]);

  // Alertas
  const [alertas] = await pool.query(`
    SELECT COUNT(*) AS n
    FROM (
      SELECT l1.colmena, (l2.peso - l1.peso) AS delta
      FROM lecturas_ambientales l1
      JOIN lecturas_ambientales l2 
        ON l2.colmena = l1.colmena
       AND l2.fecha_registro = (
         SELECT MIN(fecha_registro) FROM lecturas_ambientales
         WHERE colmena = l1.colmena AND fecha_registro > l1.fecha_registro
       )
      JOIN colmenas c ON c.id = l1.colmena
      ${where}
      AND l2.fecha_registro BETWEEN ? AND ?
      AND (l2.peso - l1.peso) <= -1.5
    ) t;
  `, [...params, from, to]);

  res.json({
    activas: activas[0]?.n || 0,
    promPeso: prom[0]?.prom || 0,
    variacion7d: var7[0]?.variacion || 0,
    alertas: alertas[0]?.n || 0,
  });
});

router.get("/serie-peso", async (req, res) => {
  const { desde, hasta, apiarioId, colmenaId } = req.query;
  const [from, to] = rango(desde, hasta);
  const params = [];
  let where = " WHERE 1=1 ";

  if (apiarioId) { where += " AND c.apiario_id = ? "; params.push(apiarioId); }
  if (colmenaId) { where += " AND c.id = ? "; params.push(colmenaId); }

  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(l.fecha_registro, '%Y-%m-%d %H:%i') AS fecha,
           c.nombre AS colmena, l.peso
    FROM lecturas_ambientales l
    JOIN colmenas c ON c.id = l.colmena
    ${where} AND l.fecha_registro BETWEEN ? AND ?
    ORDER BY l.fecha_registro;
  `, [...params, from, to]);
  res.json(rows);
});

// ========================================================
// 📊 REPORTES ADMINISTRATIVOS NUEVOS
// ========================================================

// 🔸 USUARIOS
router.get("/usuarios/resumen", async (req, res) => {
  const { desde, hasta } = req.query;
  const [from, to] = rango(desde, hasta);
  const [resumen] = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      SUM(esta_activo=1) AS activos,
      SUM(esta_activo=0) AS inactivos
    FROM usuarios
    WHERE fecha_creacion BETWEEN ? AND ?;
  `, [from, to]);

  const [porRol] = await pool.query(`
    SELECT r.nombre AS rol, COUNT(u.id) AS cantidad
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.fecha_creacion BETWEEN ? AND ?
    GROUP BY r.nombre;
  `, [from, to]);

  res.json({ ...resumen[0], porRol });
});

router.get("/usuarios/crecimiento", async (req, res) => {
  const { desde, hasta } = req.query;
  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(fecha_creacion, '%Y-%m') AS mes, COUNT(*) AS altas
    FROM usuarios
    WHERE fecha_creacion BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m')
    ORDER BY mes;
  `, [desde + " 00:00:00", hasta + " 23:59:59"]);
  res.json(rows);
});

router.get("/usuarios/listado", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.nombre, u.apellido_paterno, u.correo_electronico, u.esta_activo, 
           DATE(u.fecha_creacion) AS fecha_creacion, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    ORDER BY u.fecha_creacion DESC;
  `);
  res.json(rows);
});

// 🔸 COLMENAS
router.get("/colmenas/resumen", async (req, res) => {
  const [[total]] = await pool.query(`SELECT COUNT(*) AS total FROM colmenas;`);
  const [[activas]] = await pool.query(`
    SELECT COUNT(DISTINCT c.id) AS activas_7d
    FROM colmenas c
    JOIN sensores s ON s.colmena_id = c.id
    JOIN lecturas_ambientales l ON l.sensor_id = s.id
    WHERE l.fecha_registro >= NOW() - INTERVAL 7 DAY;
  `);
  const [[conSensor]] = await pool.query(`
    SELECT COUNT(DISTINCT c.id) AS con_sensor
    FROM colmenas c
    JOIN sensores s ON s.colmena_id = c.id;
  `);
  const [[sinSensor]] = await pool.query(`
    SELECT COUNT(*) AS sin_sensor
    FROM colmenas c
    LEFT JOIN sensores s ON s.colmena_id = c.id
    WHERE s.id IS NULL;
  `);

  res.json({
    total: total.total,
    activas_7d: activas.activas_7d,
    con_sensor: conSensor.con_sensor,
    sin_sensor: sinSensor.sin_sensor,
  });
});

router.get("/colmenas/por-apiario", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT a.nombre AS apiario, COUNT(c.id) AS colmenas
    FROM apiarios a
    LEFT JOIN colmenas c ON c.apiario_id = a.id
    GROUP BY a.id, a.nombre
    ORDER BY colmenas DESC;
  `);
  res.json(rows);
});

// 🔸 APIARIOS
router.get("/apiarios/resumen-admin", async (req, res) => {
  const [[apiarios]] = await pool.query(`SELECT COUNT(*) AS apiarios FROM apiarios;`);
  const [[colmenas]] = await pool.query(`SELECT COUNT(*) AS colmenas FROM colmenas;`);
  const [[sensores]] = await pool.query(`SELECT COUNT(*) AS sensores FROM sensores;`);
  const [[lecturas]] = await pool.query(`
    SELECT COUNT(*) AS lecturas_7d 
    FROM lecturas_ambientales
    WHERE fecha_registro >= NOW() - INTERVAL 7 DAY;
  `);
  res.json({ ...apiarios, ...colmenas, ...sensores, ...lecturas });
});

router.get("/apiarios/top-actividad", async (req, res) => {
  const { desde, hasta } = req.query;
  const [rows] = await pool.query(`
    SELECT a.nombre AS apiario, COUNT(l.id) AS lecturas
    FROM apiarios a
    LEFT JOIN colmenas c ON c.apiario_id = a.id
    LEFT JOIN sensores s ON s.colmena_id = c.id
    LEFT JOIN lecturas_ambientales l ON l.sensor_id = s.id
    AND l.fecha_registro BETWEEN ? AND ?
    GROUP BY a.id, a.nombre
    ORDER BY lecturas DESC;
  `, [desde + " 00:00:00", hasta + " 23:59:59"]);
  res.json(rows);
});

module.exports = router;
