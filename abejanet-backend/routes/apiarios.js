const express = require("express");
const router = express.Router();
const pool = require("../db"); // Conexión a PostgreSQL

/* ------------------------------------------------------
   OBTENER TODOS los apiarios (con búsqueda por nombre)
   GET /api/apiarios?buscar=texto
------------------------------------------------------ */
router.get("/apiarios", async (req, res) => {
  try {
    const { buscar } = req.query;

    let baseQuery = `
      SELECT * FROM apiarios
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    // Filtro por Nombre (Búsqueda parcial ILIKE)
    if (buscar) {
      baseQuery += ` AND nombre ILIKE $${idx++}`;
      params.push(`%${buscar}%`);
    }

    baseQuery += " ORDER BY id ASC;";

    const result = await pool.query(baseQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener apiarios:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   CREAR un nuevo apiario
------------------------------------------------------ */
router.post("/apiarios", async (req, res) => {
  try {
    // Mapeamos los campos del frontend a las columnas de la BD
    // Frontend suele enviar: nombre, descripcion, ubicacion
    // BD espera: nombre, descripcion_general, direccion_o_coordenadas
    const { 
      nombre, 
      descripcion, 
      ubicacion, 
      usuario_id 
    } = req.body;

    const nombreFinal = nombre || null;
    const descripcionFinal = descripcion || null;
    const direccionFinal = ubicacion || null; // 'ubicacion' del front -> 'direccion_o_coordenadas' en BD
    const usuarioIdFinal = usuario_id || null;

    const query = `
      INSERT INTO apiarios (nombre, descripcion_general, direccion_o_coordenadas, creado_por_usuario_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    let result;
    try {
      result = await pool.query(query, [
        nombreFinal,
        descripcionFinal,
        direccionFinal,
        usuarioIdFinal
      ]);
    } catch (error) {
      // 23505 = unique_violation (Nombre duplicado)
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Ya existe un apiario con ese nombre." });
      }
      throw error;
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear apiario:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   ACTUALIZAR un apiario
------------------------------------------------------ */
router.put("/apiarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      ubicacion 
    } = req.body;

    const nombreFinal = nombre || null;
    const descripcionFinal = descripcion || null;
    const direccionFinal = ubicacion || null;

    const query = `
      UPDATE apiarios
      SET 
        nombre = $1,
        descripcion_general = $2,
        direccion_o_coordenadas = $3
      WHERE id = $4
      RETURNING *;
    `;

    let result;
    try {
      result = await pool.query(query, [
        nombreFinal,
        descripcionFinal,
        direccionFinal,
        id
      ]);
    } catch (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Ya existe otro apiario con ese nombre." });
      }
      throw error;
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Apiario no encontrado" });
    }

    res.json({ 
      message: "Apiario actualizado correctamente",
      apiario: result.rows[0]
    });
  } catch (error) {
    console.error("Error al actualizar apiario:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   ELIMINAR un apiario
------------------------------------------------------ */
router.delete("/apiarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Nota: Si hay colmenas vinculadas a este apiario, podría fallar si no hay CASCADE
    const query = "DELETE FROM apiarios WHERE id = $1 RETURNING id;";
    
    let result;
    try {
        result = await pool.query(query, [id]);
    } catch (error) {
        // 23503 = foreign_key_violation (Si tienes colmenas dependiendo de este apiario)
        if (error.code === '23503') {
            return res.status(400).json({ error: "No se puede eliminar el apiario porque tiene colmenas asignadas." });
        }
        throw error;
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Apiario no encontrado" });
    }

    res.json({ message: "Apiario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar apiario:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;