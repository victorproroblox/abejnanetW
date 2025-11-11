// routes/sensores.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/sensores", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM sensores");

    if (rows.length === 0) {
      return res.status(404).json({ error: "No hay sensores registrados" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener sensores:", error.message);
    res.status(500).json({ error: "Error al obtener sensores" });
  }
});

module.exports = router;
