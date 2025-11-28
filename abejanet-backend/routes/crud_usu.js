// routes/crud_usu.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // Ajusta la ruta a tu archivo db.js

/* ------------------------------------------------------
   OBTENER TODOS los usuarios
   GET /api/usuarios?correo=texto
------------------------------------------------------ */
router.get("/usuarios", async (req, res) => {
  try {
    const { correo } = req.query;

    let baseQuery = `
      SELECT 
        u.*, 
        r.nombre AS nombre_rol 
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    // Filtro por Correo
    if (correo) {
      baseQuery += ` AND u.correo_electronico ILIKE $${idx++}`;
      params.push(`%${correo}%`);
    }

    baseQuery += " ORDER BY u.id ASC;";

    const result = await pool.query(baseQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   CREAR un nuevo usuario
------------------------------------------------------ */
router.post("/usuarios", async (req, res) => {
  try {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      correo_electronico,
      contrasena,
      push_token,
      rol_id,
      esta_activo
    } = req.body;

    const nombreFinal = nombre || null;
    const apPaternoFinal = apellido_paterno || null;
    const apMaternoFinal = apellido_materno || null;
    const contrasenaFinal = contrasena || null;
    const pushTokenFinal = push_token || null;
    // Si no viene el estado, asumimos true (activo)
    const activoFinal = esta_activo !== undefined ? esta_activo : true;

    const query = `
      INSERT INTO usuarios 
      (nombre, apellido_paterno, apellido_materno, correo_electronico, contrasena, push_token, rol_id, esta_activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;

    let result;
    try {
      result = await pool.query(query, [
        nombreFinal,
        apPaternoFinal,
        apMaternoFinal,
        correo_electronico,
        contrasenaFinal,
        pushTokenFinal,
        rol_id,
        activoFinal
      ]);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "El correo electrónico ya está registrado." });
      }
      throw error;
    }

    res.status(201).json({
      id: result.rows[0].id,
      ...req.body,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   ACTUALIZAR un usuario
------------------------------------------------------ */
router.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      correo_electronico,
      contrasena,
      push_token,
      rol_id,
      esta_activo
    } = req.body;

    const nombreFinal = nombre || null;
    const apPaternoFinal = apellido_paterno || null;
    const apMaternoFinal = apellido_materno || null;
    const contrasenaFinal = contrasena || null;
    const pushTokenFinal = push_token || null;

    const query = `
      UPDATE usuarios
      SET 
        nombre = $1,
        apellido_paterno = $2,
        apellido_materno = $3,
        correo_electronico = $4,
        contrasena = $5,
        push_token = $6,
        rol_id = $7,
        esta_activo = $8
      WHERE id = $9;
    `;

    let result;
    try {
      result = await pool.query(query, [
        nombreFinal,
        apPaternoFinal,
        apMaternoFinal,
        correo_electronico,
        contrasenaFinal,
        pushTokenFinal,
        rol_id,
        esta_activo,
        id,
      ]);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "El correo electrónico ya está en uso por otro usuario." });
      }
      throw error;
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   ELIMINAR un usuario
------------------------------------------------------ */
router.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM usuarios WHERE id = $1;";
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;