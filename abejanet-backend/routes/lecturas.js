// routes/lecturas.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// Crear una lectura ambiental
router.post("/lecturas", async (req, res) => {
  try {
    let {
      sensor_id,
      temperatura,   // requerido para tu caso de prueba
      humedad,       // opcional
      peso,          // opcional
      sonido,        // opcional
      lluvia         // opcional (boolean o 0/1)
    } = req.body;

    // Validaciones básicas
    if (!sensor_id) {
      return res.status(400).json({ error: "sensor_id es requerido" });
    }
    if (temperatura === undefined || temperatura === null) {
      return res.status(400).json({ error: "temperatura es requerida" });
    }

    // Coerción/normalización de tipos
    const sensorId = parseInt(sensor_id, 10);
    const tempVal = parseFloat(temperatura);
    const humVal = humedad !== undefined && humedad !== null ? parseFloat(humedad) : null;
    const pesoVal = peso !== undefined && peso !== null ? parseFloat(peso) : null;
    const sonidoVal = sonido !== undefined && sonido !== null ? parseFloat(sonido) : null;
    const lluviaVal =
      lluvia === undefined || lluvia === null
        ? null
        : (lluvia === true || lluvia === 1 || lluvia === "1") ? 1
        : (lluvia === false || lluvia === 0 || lluvia === "0") ? 0
        : null; // si viene cualquier otra cosa, lo dejamos en null

    if (Number.isNaN(sensorId)) {
      return res.status(400).json({ error: "sensor_id debe ser numérico" });
    }
    if (Number.isNaN(tempVal)) {
      return res.status(400).json({ error: "temperatura debe ser numérica" });
    }

    // Verificar que el sensor exista
    const [sensorRows] = await pool.query(
      "SELECT id FROM sensores WHERE id = ? LIMIT 1",
      [sensorId]
    );
    if (sensorRows.length === 0) {
      return res.status(404).json({ error: "Sensor no encontrado" });
    }

    // Insertar lectura (fecha_registro usa current_timestamp() por defecto)
    const [result] = await pool.query(
      `INSERT INTO lecturas_ambientales
       (sensor_id, humedad, temperatura, peso, sonido, lluvia)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sensorId, humVal, tempVal, pesoVal, sonidoVal, lluviaVal]
    );

    // Devolver la fila insertada
    const [inserted] = await pool.query(
      `SELECT id, sensor_id, humedad, temperatura, peso, sonido, lluvia, fecha_registro
       FROM lecturas_ambientales
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Lectura creada correctamente",
      lectura: inserted[0]
    });
  } catch (err) {
    console.error("Error al crear lectura:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
