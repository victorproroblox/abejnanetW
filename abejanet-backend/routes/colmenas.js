const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/colmenas", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT colmenas.id, colmenas.nombre, colmenas.descripcion_especifica, apiarios.nombre AS apiario
      FROM colmenas
      JOIN apiarios ON colmenas.apiario_id = apiarios.id
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener colmenas:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});
router.get("/colmenas/:id/detalle", async (req, res) => {
    const colmenaId = req.params.id;
  
    try {
      // 1. Info de colmena
      const [colmena] = await pool.query(`
        SELECT c.id, c.nombre, c.descripcion_especifica, a.nombre AS apiario
        FROM colmenas c
        JOIN apiarios a ON c.apiario_id = a.id
        WHERE c.id = ?
      `, [colmenaId]);
  
      if (colmena.length === 0) return res.status(404).json({ error: "Colmena no encontrada" });
  
      // 2. Sensores asignados
      const [sensores] = await pool.query(`
        SELECT id, tipo_sensor, mac_address, estado
        FROM sensores
        WHERE colmena_id = ?
      `, [colmenaId]);
  
      // 3. Lecturas ambientales (últimos 20 registros)
      const [lecturas] = await pool.query(`
        SELECT l.fecha_registro, l.temperatura, l.humedad, l.peso
        FROM lecturas_ambientales l
        JOIN sensores s ON l.sensor_id = s.id
        WHERE s.colmena_id = ?
        ORDER BY l.fecha_registro DESC
        LIMIT 20
      `, [colmenaId]);
  
      res.json({
        colmena: colmena[0],
        sensores,
        lecturas
      });
  
    } catch (error) {
      console.error("Error al obtener detalle de colmena:", error.message);
      res.status(500).json({ error: "Error del servidor" });
    }
  });
  

module.exports = router;
