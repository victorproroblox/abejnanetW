const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");
require("dotenv").config();

router.post("/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE correo_electronico = ? AND esta_activo = 1",
      [correo_electronico]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no encontrado o inactivo" });
    }

    const usuario = rows[0];

    // Para esta demo, la contraseña no está encriptada (pero puedes activarlo más adelante con bcrypt)
    const passwordValida = contrasena === usuario.contrasena;

    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    delete usuario.contrasena;

    res.json({ token, usuario });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
