// backend/routes/colmenas.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ===========================
   LISTA DE COLMENAS
=========================== */
router.get("/colmenas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.descripcion_especifica,
        a.nombre AS apiario
      FROM colmenas c
      JOIN apiarios a ON c.apiario_id = a.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener colmenas:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ===========================
   DETALLE DE COLMENA (para dashboard)
=========================== */
router.get("/colmenas/:id/detalle", async (req, res) => {
  const colmenaId = req.params.id;

  try {
    // 1) Info de colmena
    const colmenaResult = await pool.query(
      `
        SELECT 
          c.id,
          c.nombre,
          c.descripcion_especifica,
          a.nombre AS apiario
        FROM colmenas c
        JOIN apiarios a ON c.apiario_id = a.id
        WHERE c.id = $1
      `,
      [colmenaId]
    );

    if (colmenaResult.rows.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    // 2) Sensores asignados
    const sensoresResult = await pool.query(
      `
        SELECT 
          id,
          tipo_sensor,
          mac_address,
          estado
        FROM sensores
        WHERE colmena_id = $1
      `,
      [colmenaId]
    );

    // 3) Lecturas ambientales (últimos 20 registros)
    const lecturasResult = await pool.query(
      `
        SELECT 
          l.fecha_registro,
          l.temperatura,
          l.humedad,
          l.peso
        FROM lecturas_ambientales l
        JOIN sensores s ON l.sensor_id = s.id
        WHERE s.colmena_id = $1
        ORDER BY l.fecha_registro DESC
        LIMIT 20
      `,
      [colmenaId]
    );

    res.json({
      colmena: colmenaResult.rows[0],
      sensores: sensoresResult.rows,
      lecturas: lecturasResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener detalle de colmena:", error.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ===========================
   CREAR COLMENA
=========================== */
/**
 * Body JSON:
 * {
 *   "apiario_id": number,   // requerido, debe existir en apiarios.id
 *   "nombre": "string",     // requerido, único, <= 100 chars
 *   "descripcion_especifica": "string" // opcional
 * }
 */
router.post("/colmenas", async (req, res) => {
  try {
    let { apiario_id, nombre, descripcion_especifica } = req.body || {};

    // Normalización
    if (typeof nombre === "string") nombre = nombre.trim();
    if (typeof descripcion_especifica === "string")
      descripcion_especifica = descripcion_especifica.trim();

    // Validaciones
    if (!apiario_id || !nombre) {
      return res.status(400).json({
        error: "Faltan campos requeridos: apiario_id y nombre",
      });
    }
    if (
      typeof nombre !== "string" ||
      nombre.length === 0 ||
      nombre.length > 100
    ) {
      return res
        .status(400)
        .json({ error: "El nombre debe ser texto (1–100 caracteres)" });
    }

    // Validar apiario
    const apiarioResult = await pool.query(
      "SELECT id FROM apiarios WHERE id = $1 LIMIT 1",
      [apiario_id]
    );
    if (apiarioResult.rows.length === 0) {
      return res.status(400).json({ error: "apiario_id inválido (no existe)" });
    }

    // Insertar
    let insertResult;
    try {
      insertResult = await pool.query(
        `
          INSERT INTO colmenas (apiario_id, nombre, descripcion_especifica)
          VALUES ($1, $2, $3)
          RETURNING id
        `,
        [apiario_id, nombre, descripcion_especifica || null]
      );
    } catch (e) {
      // 23505 = unique_violation en Postgres
      if (e && e.code === "23505") {
        return res
          .status(409)
          .json({ error: "El nombre de la colmena ya está en uso" });
      }
      throw e;
    }

    const insertId = insertResult.rows[0].id;

    // Devolver fila creada
    const rowResult = await pool.query(
      `
        SELECT 
          c.id,
          c.nombre,
          c.descripcion_especifica,
          c.fecha_creacion,
          a.id AS apiario_id,
          a.nombre AS apiario
        FROM colmenas c
        JOIN apiarios a ON c.apiario_id = a.id
        WHERE c.id = $1
      `,
      [insertId]
    );

    return res.status(201).json(rowResult.rows[0]);
  } catch (err) {
    console.error("Error al crear colmena:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ===========================
   EDITAR COLMENA
=========================== */
/**
 * PUT /colmenas/:id
 * Body JSON (uno o varios campos):
 * {
 *   "apiario_id": number,              // opcional; si viene, debe existir
 *   "nombre": "string (<=100)",        // opcional; respeta UNIQUE
 *   "descripcion_especifica": "string" // opcional
 * }
 */
router.put("/colmenas/:id", async (req, res) => {
  const { id } = req.params;
  let { apiario_id, nombre, descripcion_especifica } = req.body || {};

  try {
    // Verificar existencia de la colmena
    const existsResult = await pool.query(
      "SELECT id FROM colmenas WHERE id = $1 LIMIT 1",
      [id]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    // Normalización
    if (typeof nombre === "string") nombre = nombre.trim();
    if (typeof descripcion_especifica === "string")
      descripcion_especifica = descripcion_especifica.trim();

    // Si viene apiario_id, validar que exista
    if (apiario_id !== undefined && apiario_id !== null) {
      const aResult = await pool.query(
        "SELECT id FROM apiarios WHERE id = $1 LIMIT 1",
        [apiario_id]
      );
      if (aResult.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "apiario_id inválido (no existe)" });
      }
    }

    // Validar nombre si viene
    if (nombre !== undefined) {
      if (
        typeof nombre !== "string" ||
        nombre.length === 0 ||
        nombre.length > 100
      ) {
        return res
          .status(400)
          .json({ error: "El nombre debe ser texto (1–100 caracteres)" });
      }
    }

    // Construir SET dinámico con $1, $2, $3...
    const fields = [];
    const params = [];
    let idx = 1;

    if (apiario_id !== undefined) {
      fields.push(`apiario_id = $${idx++}`);
      params.push(apiario_id);
    }
    if (nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      params.push(nombre);
    }
    if (descripcion_especifica !== undefined) {
      fields.push(`descripcion_especifica = $${idx++}`);
      params.push(descripcion_especifica || null);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ error: "No se recibió ningún campo para actualizar" });
    }

    // último parámetro: id
    params.push(id);
    const queryText = `UPDATE colmenas SET ${fields.join(", ")} WHERE id = $${idx}`;

    try {
      const updResult = await pool.query(queryText, params);

      if (updResult.rowCount === 0) {
        return res.status(404).json({ error: "Colmena no encontrada" });
      }
    } catch (e) {
      // 23505 = unique_violation (nombre duplicado)
      if (e && e.code === "23505") {
        return res
          .status(409)
          .json({ error: "El nombre de la colmena ya está en uso" });
      }
      throw e;
    }

    // Devolver fila actualizada (con nombre de apiario)
    const rowResult = await pool.query(
      `
        SELECT 
          c.id,
          c.nombre,
          c.descripcion_especifica,
          c.fecha_creacion,
          a.id AS apiario_id,
          a.nombre AS apiario
        FROM colmenas c
        JOIN apiarios a ON c.apiario_id = a.id
        WHERE c.id = $1
      `,
      [id]
    );

    return res.json(rowResult.rows[0]);
  } catch (err) {
    console.error("Error al actualizar colmena:", err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ===========================
   ELIMINAR COLMENA
=========================== */
/**
 * DELETE /colmenas/:id
 * - Normal: bloquea si hay dependencias (sensores/lecturas) -> 409
 * - Forzado: ?force=1|true => elimina lecturas, sensores y luego la colmena (transacción)
 */
router.delete("/colmenas/:id", async (req, res) => {
  const { id } = req.params;
  const force =
    String(req.query.force || "").toLowerCase() === "1" ||
    String(req.query.force || "").toLowerCase() === "true";

  const client = await pool.connect();
  try {
    // Verificar existencia
    const existsResult = await client.query(
      "SELECT id FROM colmenas WHERE id = $1 LIMIT 1",
      [id]
    );
    if (existsResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    // Contar dependencias: sensores
    const sensoresCountResult = await client.query(
      "SELECT COUNT(*) AS sensores_count FROM sensores WHERE colmena_id = $1",
      [id]
    );
    const sensores_count = parseInt(
      sensoresCountResult.rows[0].sensores_count,
      10
    );

    // Lecturas ligadas a sensores de esta colmena
    const lecturasCountResult = await client.query(
      `
        SELECT COUNT(*) AS lecturas_count
        FROM lecturas_ambientales l
        JOIN sensores s ON l.sensor_id = s.id
        WHERE s.colmena_id = $1
      `,
      [id]
    );
    const lecturas_count = parseInt(
      lecturasCountResult.rows[0].lecturas_count,
      10
    );

    if (!force) {
      if (sensores_count > 0 || lecturas_count > 0) {
        client.release();
        return res.status(409).json({
          error: "No se puede eliminar: la colmena tiene dependencias",
          detalles: { sensores: sensores_count, lecturas: lecturas_count },
          hint: "Usa ?force=1 para eliminar en cascada (lecturas, sensores y colmena).",
        });
      }

      // Sin dependencias: borrar directo
      const delResult = await client.query(
        "DELETE FROM colmenas WHERE id = $1",
        [id]
      );
      client.release();
      return res.json({ ok: true, deleted: delResult.rowCount, id });
    }

    // ===== Borrado forzado en transacción =====
    await client.query("BEGIN");

    // 1) Eliminar lecturas de sensores de la colmena
    await client.query(
      `
        DELETE FROM lecturas_ambientales l
        USING sensores s
        WHERE l.sensor_id = s.id
          AND s.colmena_id = $1
      `,
      [id]
    );

    // 2) Eliminar sensores de la colmena
    await client.query("DELETE FROM sensores WHERE colmena_id = $1", [id]);

    // 3) Eliminar la colmena
    const delColmenaResult = await client.query(
      "DELETE FROM colmenas WHERE id = $1",
      [id]
    );

    await client.query("COMMIT");
    client.release();

    return res.json({
      ok: true,
      forced: true,
      deleted: delColmenaResult.rowCount,
      id,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (e) {}
    client.release();
    console.error("Error al eliminar colmena:", err.message);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

/* ===========================
   GET /colmenas/:id  (para edición)
=========================== */
router.get("/colmenas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.apiario_id,
        a.nombre AS apiario,
        c.nombre,
        c.descripcion_especifica,
        c.fecha_creacion
      FROM colmenas c
      JOIN apiarios a ON c.apiario_id = a.id
      WHERE c.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener colmena:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
