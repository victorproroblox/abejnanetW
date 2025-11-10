// routes/sensores.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // Tu conexión a MySQL

// ------------------------------------------------------
// OBTENER TODOS los sensores (¡AHORA CON FILTROS!)
// GET /api/sensores
// ------------------------------------------------------
router.get("/sensores", async (req, res) => {
  try {
    // ---- INICIO DE LA MODIFICACIÓN ----
    const { colmena, mac } = req.query; // Capturamos los filtros

    let baseQuery = `
      SELECT 
        s.*, 
        c.nombre AS nombre_colmena 
      FROM sensores s
      LEFT JOIN colmenas c ON s.colmena_id = c.id
      WHERE 1=1 
    `; // <-- El truco del 1=1

    const params = []; // Array para los parámetros seguros

    // Si llega el filtro de colmena, lo añadimos
    if (colmena) {
      baseQuery += " AND s.colmena_id = ?";
      params.push(colmena);
    }

    // Si llega el filtro de MAC, lo añadimos
    if (mac) {
      baseQuery += " AND s.mac_address LIKE ?";
      params.push(`%${mac}%`); // LIKE con wildcards
    }

    baseQuery += " ORDER BY s.id ASC;";
    
    // Ejecutamos la consulta dinámica
    const [rows] = await pool.query(baseQuery, params);
    // ---- FIN DE LA MODIFICACIÓN ----

    res.json(rows); 
  } catch (error) {
    console.error("Error al obtener sensores:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------
// CREAR un nuevo sensor (CON MANEJO DE DUPLICADOS)
// ------------------------------------------------------
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
      VALUES (?, ?, ?, ?, ?);
    `;
    
    const [result] = await pool.query(query, [
      colmenaIdFinal,
      tipo_sensor,
      estado,
      fechaInstalacionFinal,
      macAddressFinal,
    ]);

    res.status(201).json({
      id: result.insertId,
      ...req.body,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Esa MAC Address ya existe en la base de datos." });
    }
    console.error("Error al crear sensor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------
// ACTUALIZAR un sensor (CON MANEJO DE DUPLICADOS)
// ------------------------------------------------------
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
        colmena_id = ?,
        tipo_sensor = ?,
        estado = ?,
        fecha_instalacion = ?,
        ultima_lectura_en = ?,
        mac_address = ?
      WHERE id = ?;
    `;
    
    const [result] = await pool.query(query, [
      colmenaIdFinal,
      tipo_sensor,
      estado,
      fechaInstalacionFinal,
      ultimaLecturaFinal,
      macAddressFinal,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Sensor no encontrado" });
    }

    res.json({ message: "Sensor actualizado correctamente" });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Esa MAC Address ya existe en la base de datos." });
    }
    
    console.error("Error al actualizar sensor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------
// ELIMINAR un sensor
// ------------------------------------------------------
router.delete("/sensores/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM sensores WHERE id = ?;";
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Sensor no encontrado" });
    }

    res.json({ message: "Sensor eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar sensor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;