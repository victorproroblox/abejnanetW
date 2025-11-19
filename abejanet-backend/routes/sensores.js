// routes/sensores.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // Conexión a PostgreSQL (pg)

/* ------------------------------------------------------
   OBTENER TODOS los sensores (con filtros)
   GET /api/sensores?colmena=ID&mac=texto
------------------------------------------------------ */
router.get("/sensores", async (req, res) => {
  try {
    const { colmena, mac } = req.query;

    let baseQuery = `
      SELECT 
        s.*, 
        c.nombre AS nombre_colmena 
      FROM sensores s
      LEFT JOIN colmenas c ON s.colmena_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    // Filtro por colmena
    if (colmena) {
      baseQuery += ` AND s.colmena_id = $${idx++}`;
      params.push(colmena);
    }

    // Filtro por MAC (LIKE/ILIKE)
    if (mac) {
      baseQuery += ` AND s.mac_address ILIKE $${idx++}`;
      params.push(`%${mac}%`);
    }

    baseQuery += " ORDER BY s.id ASC;";

    const result = await pool.query(baseQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener sensores:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   CREAR un nuevo sensor (con manejo de duplicados)
------------------------------------------------------ */
router.post("/sensores", async (req, res) => {
  try {
    const {
      colmena_id,
      tipo_sensor,
      estado,
      fecha_instalacion,
      mac_address,
    } = req.body;

    const colmenaIdFinal = colmena_id || null;
    const fechaInstalacionFinal = fecha_instalacion || null;
    const macAddressFinal = mac_address || null;

    const query = `
      INSERT INTO sensores (colmena_id, tipo_sensor, estado, fecha_instalacion, mac_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    let result;
    try {
      result = await pool.query(query, [
        colmenaIdFinal,
        tipo_sensor,
        estado,
        fechaInstalacionFinal,
        macAddressFinal,
      ]);
    } catch (error) {
      // 23505 = unique_violation en PostgreSQL
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Esa MAC Address ya existe en la base de datos." });
      }
      throw error;
    }

    res.status(201).json({
      id: result.rows[0].id,
      ...req.body,
    });
  } catch (error) {
    console.error("Error al crear sensor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   ACTUALIZAR un sensor (con manejo de duplicados)
------------------------------------------------------ */
router.put("/sensores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      colmena_id,
      tipo_sensor,
      estado,
      fecha_instalacion,
      ultima_lectura_en,
      mac_address,
    } = req.body;

    const colmenaIdFinal = colmena_id || null;
    const fechaInstalacionFinal = fecha_instalacion || null;
    const ultimaLecturaFinal = ultima_lectura_en || null;
    const macAddressFinal = mac_address || null;

    const query = `
      UPDATE sensores
      SET 
        colmena_id = $1,
        tipo_sensor = $2,
        estado = $3,
        fecha_instalacion = $4,
        ultima_lectura_en = $5,
        mac_address = $6
      WHERE id = $7;
    `;

    let result;
    try {
      result = await pool.query(query, [
        colmenaIdFinal,
        tipo_sensor,
        estado,
        fechaInstalacionFinal,
        ultimaLecturaFinal,
        macAddressFinal,
        id,
      ]);
    } catch (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Esa MAC Address ya existe en la base de datos." });
      }
      throw error;
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sensor no encontrado" });
    }

    res.json({ message: "Sensor actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar sensor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   ELIMINAR un sensor
------------------------------------------------------ */
router.delete("/sensores/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM sensores WHERE id = $1;";
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sensor no encontrado" });
    }

    res.json({ message: "Sensor eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar sensor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
