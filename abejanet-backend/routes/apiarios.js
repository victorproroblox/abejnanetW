const express = require("express");
const router = express.Router();
const pool = require("../db");

<<<<<<< HEAD
/* ====================================================
   LISTA DE APIARIOS
   GET /apiarios
   - opcional: ?q=texto  (busca por nombre / dirección)
==================================================== */
=======
// LISTA DE APIARIOS (para combos, etc.)
>>>>>>> 07f2e501f58d3abde1f1ff0af3a8993f28d36fd5
router.get("/apiarios", async (req, res) => {
  try {
    // Soporta filtro opcional ?q=texto
    const q = (req.query.q || "").trim();
    let rows;

    if (q) {
      const like = `%${q}%`;
<<<<<<< HEAD
      result = await pool.query(
        `
        SELECT 
          id,
          nombre,
          direccion_o_coordenadas AS ubicacion,
          descripcion_general      AS descripcion,
          fecha_creacion
        FROM apiarios
        WHERE nombre ILIKE $1 
           OR direccion_o_coordenadas ILIKE $1
        ORDER BY id DESC
        `,
=======
      // En Postgres usamos $1 y podemos usar ILIKE para búsqueda case-insensitive
      const result = await pool.query(
        "SELECT id, nombre FROM apiarios WHERE nombre ILIKE $1 ORDER BY nombre ASC",
>>>>>>> 07f2e501f58d3abde1f1ff0af3a8993f28d36fd5
        [like]
      );
      rows = result.rows;
    } else {
<<<<<<< HEAD
      result = await pool.query(
        `
        SELECT 
          id,
          nombre,
          direccion_o_coordenadas AS ubicacion,
          descripcion_general      AS descripcion,
          fecha_creacion
        FROM apiarios
        ORDER BY id DESC
        `
=======
      const result = await pool.query(
        "SELECT id, nombre FROM apiarios ORDER BY nombre ASC"
>>>>>>> 07f2e501f58d3abde1f1ff0af3a8993f28d36fd5
      );
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener apiarios:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

<<<<<<< HEAD
/* ====================================================
   OBTENER UN APIARIO POR ID
   GET /apiarios/:id
==================================================== */
router.get("/apiarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        nombre,
        direccion_o_coordenadas AS ubicacion,
        descripcion_general      AS descripcion,
        fecha_creacion
      FROM apiarios
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Apiario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener apiario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ====================================================
   CREAR APIARIO
   POST /apiarios
   Body JSON:
   {
     "nombre": "Apiario Principal",       // requerido (1–150)
     "ubicacion": "19.43 N, 99.13 W",     // opcional -> direccion_o_coordenadas
     "descripcion": "Texto descriptivo"   // opcional -> descripcion_general
   }
==================================================== */
router.post("/apiarios", async (req, res) => {
  try {
    let { nombre, ubicacion, descripcion } = req.body || {};

    if (typeof nombre === "string") nombre = nombre.trim();
    if (typeof ubicacion === "string") ubicacion = ubicacion.trim();
    if (typeof descripcion === "string") descripcion = descripcion.trim();

    // Validaciones básicas
    if (!nombre) {
      return res
        .status(400)
        .json({ error: "El campo 'nombre' es obligatorio" });
    }
    if (typeof nombre !== "string" || nombre.length > 150) {
      return res.status(400).json({
        error: "El nombre debe ser texto (1–150 caracteres)",
      });
    }

    let insertResult;
    try {
      insertResult = await pool.query(
        `
        INSERT INTO apiarios (nombre, descripcion_general, direccion_o_coordenadas)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [nombre, descripcion || null, ubicacion || null]
      );
    } catch (e) {
      // 23505 = unique_violation (nombre UNIQUE)
      if (e && e.code === "23505") {
        return res
          .status(409)
          .json({ error: "Ya existe un apiario con ese nombre" });
      }
      throw e;
    }

    const newId = insertResult.rows[0].id;

    const row = await pool.query(
      `
      SELECT 
        id,
        nombre,
        direccion_o_coordenadas AS ubicacion,
        descripcion_general      AS descripcion,
        fecha_creacion
      FROM apiarios
      WHERE id = $1
      `,
      [newId]
    );

    return res.status(201).json(row.rows[0]);
  } catch (err) {
    console.error("Error al crear apiario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ====================================================
   EDITAR APIARIO
   PUT /apiarios/:id
   Body JSON (uno o varios campos):
   {
     "nombre": "Nuevo nombre",      // opcional
     "ubicacion": "Nuevo lugar",    // opcional
     "descripcion": "Texto..."      // opcional
   }
==================================================== */
router.put("/apiarios/:id", async (req, res) => {
  const { id } = req.params;
  let { nombre, ubicacion, descripcion } = req.body || {};

  try {
    // verificar que exista
    const exists = await pool.query(
      "SELECT id FROM apiarios WHERE id = $1 LIMIT 1",
      [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Apiario no encontrado" });
    }

    // Normalizar
    if (typeof nombre === "string") nombre = nombre.trim();
    if (typeof ubicacion === "string") ubicacion = ubicacion.trim();
    if (typeof descripcion === "string") descripcion = descripcion.trim();

    // Validar nombre si viene
    if (nombre !== undefined) {
      if (!nombre || typeof nombre !== "string" || nombre.length > 150) {
        return res.status(400).json({
          error: "El nombre debe ser texto (1–150 caracteres)",
        });
      }
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      params.push(nombre);
    }
    if (descripcion !== undefined) {
      fields.push(`descripcion_general = $${idx++}`);
      params.push(descripcion || null);
    }
    if (ubicacion !== undefined) {
      fields.push(`direccion_o_coordenadas = $${idx++}`);
      params.push(ubicacion || null);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ error: "No se recibió ningún campo para actualizar" });
    }

    // último parámetro: id
    params.push(id);
    const query = `UPDATE apiarios SET ${fields.join(", ")} WHERE id = $${params.length}`;

    try {
      await pool.query(query, params);
    } catch (e) {
      if (e && e.code === "23505") {
        return res
          .status(409)
          .json({ error: "Ya existe un apiario con ese nombre" });
      }
      throw e;
    }

    // devolver apiario actualizado
    const row = await pool.query(
      `
      SELECT 
        id,
        nombre,
        direccion_o_coordenadas AS ubicacion,
        descripcion_general      AS descripcion,
        fecha_creacion
      FROM apiarios
      WHERE id = $1
      `,
      [id]
    );

    res.json(row.rows[0]);
  } catch (err) {
    console.error("Error al actualizar apiario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ====================================================
   ELIMINAR APIARIO
   DELETE /apiarios/:id
   - Bloquea si hay colmenas asociadas
==================================================== */
router.delete("/apiarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Existe el apiario
    const exists = await pool.query(
      "SELECT id FROM apiarios WHERE id = $1 LIMIT 1",
      [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Apiario no encontrado" });
    }

    // Verificar dependencias: colmenas
    const dep = await pool.query(
      "SELECT COUNT(*) AS colmenas FROM colmenas WHERE apiario_id = $1",
      [id]
    );
    const colmenas = parseInt(dep.rows[0].colmenas, 10);

    if (colmenas > 0) {
      return res.status(409).json({
        error:
          "No se puede eliminar el apiario porque tiene colmenas asociadas.",
        detalles: { colmenas },
        hint: "Elimina o reasigna las colmenas antes de borrar este apiario.",
      });
    }

    const del = await pool.query("DELETE FROM apiarios WHERE id = $1", [id]);

    return res.json({ ok: true, deleted: del.rowCount, id });
  } catch (err) {
    console.error("Error al eliminar apiario:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

=======
>>>>>>> 07f2e501f58d3abde1f1ff0af3a8993f28d36fd5
module.exports = router;
