// routes/usuarios.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ Obtener usuario por correo
router.get("/usuarios/:correo", async (req, res) => {
  const { correo } = req.params;

  try {
    const [results] = await pool.query(
      "SELECT * FROM usuarios WHERE correo_electronico = ?",
      [correo]
    );

    if (results.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(results[0]);
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
    const [result] = await pool.query(
      `UPDATE usuarios 
       SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, correo_electronico = ?
       WHERE id = ?`,
      [nombre, apellido_paterno, apellido_materno, correo_electronico, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    // 🔄 Devolver usuario actualizado
    const [updatedUser] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [id]);

    res.json(updatedUser[0]);
  } catch (err) {
    console.error("Error al actualizar usuario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;

