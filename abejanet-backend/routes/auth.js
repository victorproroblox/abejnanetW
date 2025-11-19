const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");
require("dotenv").config();

router.post("/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  try {
    // En Postgres usamos $1 como placeholder
    // Opción 1 (si esta_activo es BOOLEAN):
    // const result = await pool.query(
    //   "SELECT * FROM usuarios WHERE correo_electronico = $1 AND esta_activo = true",
    //   [correo_electronico]
    // );

    // Opción 2 (si esta_activo es INT 0/1, similar a MySQL):
    // routes/auth.js (o donde tengas el login)
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE correo_electronico = $1 AND esta_activo = true",
      [correo_electronico]
    );


    const rows = result.rows;

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ mensaje: "Usuario no encontrado o inactivo" });
    }

    const usuario = rows[0];

    // Para esta demo, la contraseña NO está encriptada
    // (más adelante puedes cambiar esto a bcrypt.compare)
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
