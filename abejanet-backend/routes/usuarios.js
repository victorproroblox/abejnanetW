// routes/usuarios.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ Obtener usuario por correo
router.get("/usuarios/:correo", async (req, res) => {
  const { correo } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE correo_electronico = $1",
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener usuario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ✅ Actualizar usuario
router.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido_paterno, apellido_materno, correo_electronico } =
    req.body;

  try {
    const result = await pool.query(
      `
      UPDATE usuarios 
      SET nombre = $1,
          apellido_paterno = $2,
          apellido_materno = $3,
          correo_electronico = $4
      WHERE id = $5
      `,
      [nombre, apellido_paterno, apellido_materno, correo_electronico, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 🔄 Devolver usuario actualizado
    const updatedResult = await pool.query(
      "SELECT * FROM usuarios WHERE id = $1",
      [id]
    );

    res.json(updatedResult.rows[0]);
  } catch (err) {
    console.error("Error al actualizar usuario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
