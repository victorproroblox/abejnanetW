const express = require("express");
const router = express.Router();
const pool = require("../db");

// LISTA DE APIARIOS (para combos, etc.)
router.get("/apiarios", async (req, res) => {
  try {
    // Soporta filtro opcional ?q=texto
    const q = (req.query.q || "").trim();
    let rows;

    if (q) {
      const like = `%${q}%`;
      // En Postgres usamos $1 y podemos usar ILIKE para búsqueda case-insensitive
      const result = await pool.query(
        "SELECT id, nombre FROM apiarios WHERE nombre ILIKE $1 ORDER BY nombre ASC",
        [like]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        "SELECT id, nombre FROM apiarios ORDER BY nombre ASC"
      );
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener apiarios:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
