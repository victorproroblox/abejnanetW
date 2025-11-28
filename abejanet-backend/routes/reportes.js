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
  try {
    const result = await pool.query(
      "SELECT id, nombre FROM apiarios ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (e) {
    console.error("Error /apiarios:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/colmenas", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, apiario_id, nombre FROM colmenas ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (e) {
    console.error("Error /colmenas:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* =========================
   OPERATIVO
========================= */
// KPIs
router.get("/resumen", async (req, res) => {
  try {
    const { desde, hasta, apiarioId, colmenaId } = req.query;
    const [from, to] = rango(desde, hasta);

    // Construimos condiciones dinámicas para usar en varias queries
    const conditions = ["1=1"];
    const baseValues = [];

    if (apiarioId) {
      conditions.push(`c.apiario_id = $${baseValues.length + 1}`);
      baseValues.push(apiarioId);
    }
    if (colmenaId) {
      conditions.push(`c.id = $${baseValues.length + 1}`);
      baseValues.push(colmenaId);
    }

    const whereClause = " WHERE " + conditions.join(" AND ");

    // 1) Colmenas activas con lecturas en el rango
    {
      const values = [...baseValues, from, to];
      const fechaIdx1 = baseValues.length + 1;
      const fechaIdx2 = baseValues.length + 2;

      const activasResult = await pool.query(
        `
        SELECT COUNT(DISTINCT c.id) AS n
        FROM lecturas_ambientales l
        JOIN sensores s ON s.id = l.sensor_id
        JOIN colmenas c ON c.id = s.colmena_id
        ${whereClause}
        AND l.fecha_registro BETWEEN $${fechaIdx1} AND $${fechaIdx2}
        `,
        values
      );

      var activas = activasResult.rows[0]?.n || 0;
    }

    // 2) Promedio de peso en el rango
    {
      const values = [...baseValues, from, to];
      const fechaIdx1 = baseValues.length + 1;
      const fechaIdx2 = baseValues.length + 2;

      const promResult = await pool.query(
        `
        SELECT AVG(l.peso) AS prom
        FROM lecturas_ambientales l
        JOIN sensores s ON s.id = l.sensor_id
        JOIN colmenas c ON c.id = s.colmena_id
        ${whereClause}
        AND l.fecha_registro BETWEEN $${fechaIdx1} AND $${fechaIdx2}
        `,
        values
      );

      var promPeso = promResult.rows[0]?.prom || 0;
    }

    // 3) Variación promedio por colmena (último - primero del rango)
    //    Versión Postgres usando subconsultas
    {
      const values = [...baseValues, from, to, from, to];
      const idxFrom1 = baseValues.length + 1;
      const idxTo1 = baseValues.length + 2;
      const idxFrom2 = baseValues.length + 3;
      const idxTo2 = baseValues.length + 4;

      const varResult = await pool.query(
        `
        SELECT AVG(last_p - first_p) AS variacion
        FROM (
          SELECT
            c.id AS colmena_id,
            -- primer peso en el rango
            (
              SELECT l1.peso
              FROM lecturas_ambientales l1
              JOIN sensores s1 ON s1.id = l1.sensor_id
              WHERE s1.colmena_id = c.id
                AND l1.fecha_registro BETWEEN $${idxFrom1} AND $${idxTo1}
              ORDER BY l1.fecha_registro ASC
              LIMIT 1
            ) AS first_p,
            -- último peso en el rango
            (
              SELECT l2.peso
              FROM lecturas_ambientales l2
              JOIN sensores s2 ON s2.id = l2.sensor_id
              WHERE s2.colmena_id = c.id
                AND l2.fecha_registro BETWEEN $${idxFrom2} AND $${idxTo2}
              ORDER BY l2.fecha_registro DESC
              LIMIT 1
            ) AS last_p
          FROM colmenas c
          -- solo consideramos colmenas que tengan lecturas en el rango y cumplan filtros
          WHERE EXISTS (
            SELECT 1
            FROM lecturas_ambientales l3
            JOIN sensores s3 ON s3.id = l3.sensor_id
            JOIN colmenas c3 ON c3.id = s3.colmena_id
            ${whereClause.replace("1=1", "c3.id = c.id")}
            AND l3.fecha_registro BETWEEN $${idxFrom1} AND $${idxTo1}
          )
        ) t
        WHERE first_p IS NOT NULL AND last_p IS NOT NULL
        `,
        values
      );

      var variacion7d = varResult.rows[0]?.variacion || 0;
    }

    // 4) Alertas por caída brusca (≤ -1.5 kg) entre lecturas consecutivas
    {
      const values = [...baseValues, from, to];
      const idxFrom = baseValues.length + 1;
      const idxTo = baseValues.length + 2;

      const alertasResult = await pool.query(
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
          ${whereClause}
          AND l1.fecha_registro BETWEEN $${idxFrom} AND $${idxTo}
        ) x
        WHERE delta <= -1.5
        `,
        values
      );

      var alertas = alertasResult.rows[0]?.n || 0;
    }

    res.json({
      activas,
      promPeso,
      variacion7d,
      alertas,
    });
  } catch (e) {
    console.error("Error KPIs /resumen:", e);
    res.status(500).json({ error: e.message });
  }
});

// Serie de peso
router.get("/serie-peso", async (req, res) => {
  try {
    const { desde, hasta, apiarioId, colmenaId } = req.query;
    const [from, to] = rango(desde, hasta);

    const conditions = ["1=1"];
    const values = [];

    if (apiarioId) {
      conditions.push(`c.apiario_id = $${values.length + 1}`);
      values.push(apiarioId);
    }
    if (colmenaId) {
      conditions.push(`c.id = $${values.length + 1}`);
      values.push(colmenaId);
    }

    const idxFrom = values.length + 1;
    const idxTo = values.length + 2;
    values.push(from, to);

    const whereClause = " WHERE " + conditions.join(" AND ");

    const result = await pool.query(
      `
      SELECT 
        to_char(l.fecha_registro, 'YYYY-MM-DD HH24:MI') AS fecha,
        c.nombre AS colmena,
        l.peso
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
      JOIN colmenas c ON c.id = s.colmena_id
      ${whereClause}
      AND l.fecha_registro BETWEEN $${idxFrom} AND $${idxTo}
      ORDER BY l.fecha_registro
      `,
      values
    );

    res.json(result.rows);
  } catch (e) {
    console.error("Error /serie-peso:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Serie ambiente (temp/humedad)
router.get("/serie-ambiente", async (req, res) => {
  try {
    const { desde, hasta, apiarioId, colmenaId } = req.query;
    const [from, to] = rango(desde, hasta);

    const conditions = ["1=1"];
    const values = [];

    if (apiarioId) {
      conditions.push(`c.apiario_id = $${values.length + 1}`);
      values.push(apiarioId);
    }
    if (colmenaId) {
      conditions.push(`c.id = $${values.length + 1}`);
      values.push(colmenaId);
    }

    const idxFrom = values.length + 1;
    const idxTo = values.length + 2;
    values.push(from, to);

    const whereClause = " WHERE " + conditions.join(" AND ");

    const result = await pool.query(
      `
      SELECT 
        to_char(l.fecha_registro, 'YYYY-MM-DD HH24:MI') AS fecha,
        l.temperatura,
        l.humedad
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
      JOIN colmenas c ON c.id = s.colmena_id
      ${whereClause}
      AND l.fecha_registro BETWEEN $${idxFrom} AND $${idxTo}
      ORDER BY l.fecha_registro
      `,
      values
    );

    res.json(result.rows);
  } catch (e) {
    console.error("Error /serie-ambiente:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* =========================
   ADMIN: USUARIOS
========================= */
// ✅ Versión Postgres
router.get("/usuarios/resumen", async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const [from, to] = rango(desde, hasta); // lo sigues usando si quieres el rango

    const { rows: [tot] } = await pool.query(
      "SELECT COUNT(*) AS total FROM usuarios"
    );

    const { rows: [act] } = await pool.query(
      "SELECT COUNT(*) AS activos FROM usuarios WHERE esta_activo = true"
    );

    const { rows: [inact] } = await pool.query(
      "SELECT COUNT(*) AS inactivos FROM usuarios WHERE esta_activo = false"
    );

    const { rows: porRol } = await pool.query(`
      SELECT r.nombre AS rol, COUNT(*) AS cantidad
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      GROUP BY r.id, r.nombre
      ORDER BY cantidad DESC
    `);

    res.json({
      total: Number(tot.total) || 0,
      activos: Number(act.activos) || 0,
      inactivos: Number(inact.inactivos) || 0,
      porRol,
    });
  } catch (e) {
    console.error("Error /usuarios/resumen:", e);
    res.status(500).json({ error: e.message });
  }
});


// Altas por mes (en rango)
router.get("/usuarios/crecimiento", async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const [from, to] = rango(desde, hasta);

    const result = await pool.query(
      `
      SELECT 
        to_char(fecha_creacion, 'YYYY-MM') AS mes,
        COUNT(*) AS altas
      FROM usuarios
      WHERE fecha_creacion BETWEEN $1 AND $2
      GROUP BY to_char(fecha_creacion, 'YYYY-MM')
      ORDER BY mes
      `,
      [from, to]
    );

    res.json(result.rows);
  } catch (e) {
    console.error("Error /usuarios/crecimiento:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Listado (puedes paginar luego)
router.get("/usuarios/listado", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.nombre,
        u.apellido_paterno,
        u.correo_electronico,
        u.esta_activo,
        to_char(u.fecha_creacion,'YYYY-MM-DD HH24:MI') AS fecha_creacion,
        r.nombre AS rol
      FROM usuarios u
      LEFT JOIN roles r ON r.id = u.rol_id
      ORDER BY u.fecha_creacion DESC
      LIMIT 100
      `
    );
    res.json(result.rows);
  } catch (e) {
    console.error("Error /usuarios/listado:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* =========================
   ADMIN: COLMENAS
========================= */
router.get("/colmenas/resumen", async (_req, res) => {
  try {
    const totResult = await pool.query(
      "SELECT COUNT(*) AS total FROM colmenas"
    );
    const conSResult = await pool.query(
      "SELECT COUNT(DISTINCT colmena_id) AS n FROM sensores WHERE colmena_id IS NOT NULL"
    );
    const sinSResult = await pool.query(
      `
      SELECT COUNT(*) AS n
      FROM colmenas
      WHERE id NOT IN (
        SELECT DISTINCT colmena_id
        FROM sensores
        WHERE colmena_id IS NOT NULL
      )
      `
    );
    const act7Result = await pool.query(
      `
      SELECT COUNT(DISTINCT c.id) AS n
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
      JOIN colmenas c ON c.id = s.colmena_id
      WHERE l.fecha_registro >= now() - interval '7 days'
      `
    );

    res.json({
      total: totResult.rows[0]?.total || 0,
      con_sensor: conSResult.rows[0]?.n || 0,
      sin_sensor: sinSResult.rows[0]?.n || 0,
      activas_7d: act7Result.rows[0]?.n || 0,
    });
  } catch (e) {
    console.error("Error /colmenas/resumen:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/colmenas/por-apiario", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT a.nombre AS apiario, COUNT(*) AS colmenas
      FROM colmenas c
      JOIN apiarios a ON a.id = c.apiario_id
      GROUP BY a.id, a.nombre
      ORDER BY colmenas DESC
      `
    );
    res.json(result.rows);
  } catch (e) {
    console.error("Error /colmenas/por-apiario:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* =========================
   ADMIN: APIARIOS
========================= */
router.get("/apiarios/resumen-admin", async (_req, res) => {
  try {
    const apiResult = await pool.query("SELECT COUNT(*) AS n FROM apiarios");
    const colResult = await pool.query("SELECT COUNT(*) AS n FROM colmenas");
    const senResult = await pool.query("SELECT COUNT(*) AS n FROM sensores");
    const lec7Result = await pool.query(
      `
      SELECT COUNT(*) AS n
      FROM lecturas_ambientales
      WHERE fecha_registro >= now() - interval '7 days'
      `
    );

    res.json({
      apiarios: apiResult.rows[0]?.n || 0,
      colmenas: colResult.rows[0]?.n || 0,
      sensores: senResult.rows[0]?.n || 0,
      lecturas_7d: lec7Result.rows[0]?.n || 0,
    });
  } catch (e) {
    console.error("Error /apiarios/resumen-admin:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/apiarios/top-actividad", async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const [from, to] = rango(desde, hasta);

    const result = await pool.query(
      `
      SELECT a.nombre AS apiario, COUNT(*) AS lecturas
      FROM lecturas_ambientales l
      JOIN sensores s ON s.id = l.sensor_id
      JOIN colmenas c ON c.id = s.colmena_id
      JOIN apiarios a ON a.id = c.apiario_id
      WHERE l.fecha_registro BETWEEN $1 AND $2
      GROUP BY a.id, a.nombre
      ORDER BY lecturas DESC
      `,
      [from, to]
    );

    res.json(result.rows);
  } catch (e) {
    console.error("Error /apiarios/top-actividad:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
