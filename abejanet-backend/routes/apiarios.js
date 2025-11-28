import express from "express";
import pool from "../db.js";

const router = express.Router();

/* ============================
   OBTENER TODOS LOS APIARIOS
============================ */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM apiarios ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener apiarios:", error);
    res.status(500).json({ error: "Error al obtener apiarios" });
  }
});

/* ============================
   CREAR APIARIO
============================ */
router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id } =
      req.body;

    // Validación: nombre único
    const nameCheck = await pool.query(
      "SELECT id FROM apiarios WHERE nombre = $1 LIMIT 1",
      [nombre]
    );

    if (nameCheck.rows.length > 0) {
      return res.status(409).json({ error: "Ese nombre ya existe" });
    }

    const result = await pool.query(
      `INSERT INTO apiarios 
      (nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear apiario:", error);
    res.status(500).json({ error: "Error al crear apiario" });
  }
});

/* ============================
   ACTUALIZAR APIARIO
============================ */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion_general, direccion_o_coordenadas } = req.body;

    const result = await pool.query(
      `UPDATE apiarios SET 
        nombre = $1,
        descripcion_general = $2,
        direccion_o_coordenadas = $3
       WHERE id = $4
       RETURNING *`,
      [nombre, descripcion_general, direccion_o_coordenadas, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar apiario:", error);
    res.status(500).json({ error: "Error al actualizar apiario" });
  }
});

/* ============================
   ELIMINAR APIARIO
============================ */
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM apiarios WHERE id = $1", [req.params.id]);
    res.json({ message: "Apiario eliminado" });
  } catch (error) {
    console.error("Error al eliminar apiario:", error);
    res.status(500).json({ error: "Error al eliminar apiario" });
  }
});

export default router;
