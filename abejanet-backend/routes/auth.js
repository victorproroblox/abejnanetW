const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

/**
 * POST /api/auth/login
 * body: { correo_electronico, contrasena }
 */
router.post("/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body || {};

  // Validaciones básicas
  if (!correo_electronico || !contrasena) {
    return res
      .status(400)
      .json({ mensaje: "correo_electronico y contrasena son requeridos" });
  }

  try {
    // Buscar usuario activo por correo
    const result = await pool.query(
      `
      SELECT
        id,
        nombre,
        apellido_paterno,
        correo_electronico,
        contrasena,
        esta_activo,
        rol_id
      FROM usuarios
      WHERE correo_electronico = $1
        AND esta_activo = true
      LIMIT 1
      `,
      [correo_electronico]
    );

    const rows = result.rows || [];

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ mensaje: "Usuario no encontrado o inactivo" });
    }

    const usuario = rows[0];

    // ⚠️ Comparación simple (sin hash, como lo tienes ahora)
    const passwordValida = contrasena === usuario.contrasena;

    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        rol_id: usuario.rol_id,
        correo_electronico: usuario.correo_electronico,
      },
      process.env.JWT_SECRET || "super_secret",
      { expiresIn: "4h" }
    );

    // No mandamos la contraseña al frontend
    delete usuario.contrasena;

    return res.json({ token, usuario });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
