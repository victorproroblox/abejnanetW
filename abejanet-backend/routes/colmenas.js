// backend/routes/colmenas.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ===========================
   LISTA DE COLMENAS
=========================== */
router.get("/colmenas", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.descripcion_especifica,
        a.nombre AS apiario
      FROM colmenas c
      JOIN apiarios a ON c.apiario_id = a.id
      ORDER BY c.id DESC
    `);
    res.json(rows);
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
    const [colmena] = await pool.query(
      `
        SELECT 
          c.id,
          c.nombre,
          c.descripcion_especifica,
          a.nombre AS apiario
        FROM colmenas c
        JOIN apiarios a ON c.apiario_id = a.id
        WHERE c.id = ?
      `,
      [colmenaId]
    );

    if (colmena.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    // 2) Sensores asignados
    const [sensores] = await pool.query(
      `
        SELECT 
          id,
          tipo_sensor,
          mac_address,
          estado
        FROM sensores
        WHERE colmena_id = ?
      `,
      [colmenaId]
    );

    // 3) Lecturas ambientales (últimos 20 registros)
    const [lecturas] = await pool.query(
      `
        SELECT 
          l.fecha_registro,
          l.temperatura,
          l.humedad,
          l.peso
        FROM lecturas_ambientales l
        JOIN sensores s ON l.sensor_id = s.id
        WHERE s.colmena_id = ?
        ORDER BY l.fecha_registro DESC
        LIMIT 20
      `,
      [colmenaId]
    );

    res.json({
      colmena: colmena[0],
      sensores,
      lecturas,
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
    const [apiarioRows] = await pool.query(
      "SELECT id FROM apiarios WHERE id = ? LIMIT 1",
      [apiario_id]
    );
    if (apiarioRows.length === 0) {
      return res.status(400).json({ error: "apiario_id inválido (no existe)" });
    }

    // Insertar
    let result;
    try {
      [result] = await pool.query(
        `
          INSERT INTO colmenas (apiario_id, nombre, descripcion_especifica)
          VALUES (?, ?, ?)
        `,
        [apiario_id, nombre, descripcion_especifica || null]
      );
    } catch (e) {
      if (e && (e.code === "ER_DUP_ENTRY" || e.errno === 1062)) {
        return res
          .status(409)
          .json({ error: "El nombre de la colmena ya está en uso" });
      }
      throw e;
    }

    const insertId = result.insertId;

    // Devolver fila creada
    const [row] = await pool.query(
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
        WHERE c.id = ?
      `,
      [insertId]
    );

    return res.status(201).json(row[0]);
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
    const [exists] = await pool.query(
      "SELECT id FROM colmenas WHERE id = ? LIMIT 1",
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    // Normalización
    if (typeof nombre === "string") nombre = nombre.trim();
    if (typeof descripcion_especifica === "string")
      descripcion_especifica = descripcion_especifica.trim();

    // Si viene apiario_id, validar que exista
    if (apiario_id !== undefined && apiario_id !== null) {
      const [a] = await pool.query(
        "SELECT id FROM apiarios WHERE id = ? LIMIT 1",
        [apiario_id]
      );
      if (a.length === 0) {
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

    // Construir SET dinámico
    const fields = [];
    const params = [];

    if (apiario_id !== undefined) {
      fields.push("apiario_id = ?");
      params.push(apiario_id);
    }
    if (nombre !== undefined) {
      fields.push("nombre = ?");
      params.push(nombre);
    }
    if (descripcion_especifica !== undefined) {
      fields.push("descripcion_especifica = ?");
      params.push(descripcion_especifica || null);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ error: "No se recibió ningún campo para actualizar" });
    }

    params.push(id);

    try {
      const [upd] = await pool.query(
        `UPDATE colmenas SET ${fields.join(", ")} WHERE id = ?`,
        params
      );

      if (upd.affectedRows === 0) {
        return res.status(404).json({ error: "Colmena no encontrada" });
      }
    } catch (e) {
      // Capturar UNIQUE de nombre duplicado contra otra colmena
      if (e && (e.code === "ER_DUP_ENTRY" || e.errno === 1062)) {
        return res
          .status(409)
          .json({ error: "El nombre de la colmena ya está en uso" });
      }
      throw e;
    }

    // Devolver fila actualizada (con nombre de apiario)
    const [row] = await pool.query(
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
        WHERE c.id = ?
      `,
      [id]
    );

    return res.json(row[0]);
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

  const conn = await pool.getConnection();
  try {
    // Verificar existencia
    const [exists] = await conn.query(
      "SELECT id FROM colmenas WHERE id = ? LIMIT 1",
      [id]
    );
    if (exists.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    // Contar dependencias
    const [[{ sensores_count }]] = await conn.query(
      "SELECT COUNT(*) AS sensores_count FROM sensores WHERE colmena_id = ?",
      [id]
    );

    // Lecturas ligadas a sensores de esta colmena
    const [[{ lecturas_count }]] = await conn.query(
      `
        SELECT COUNT(*) AS lecturas_count
        FROM lecturas_ambientales l
        JOIN sensores s ON l.sensor_id = s.id
        WHERE s.colmena_id = ?
      `,
      [id]
    );

    if (!force) {
      if (sensores_count > 0 || lecturas_count > 0) {
        conn.release();
        return res.status(409).json({
          error: "No se puede eliminar: la colmena tiene dependencias",
          detalles: { sensores: sensores_count, lecturas: lecturas_count },
          hint: "Usa ?force=1 para eliminar en cascada (lecturas, sensores y colmena).",
        });
      }

      // Sin dependencias: borrar directo
      const [del] = await conn.query("DELETE FROM colmenas WHERE id = ?", [
        id,
      ]);
      conn.release();
      return res.json({ ok: true, deleted: del.affectedRows, id });
    }

    // ===== Borrado forzado en transacción =====
    await conn.beginTransaction();

    // 1) Eliminar lecturas de sensores de la colmena
    await conn.query(
      `
        DELETE l FROM lecturas_ambientales l
        JOIN sensores s ON l.sensor_id = s.id
        WHERE s.colmena_id = ?
      `,
      [id]
    );

    // 2) Eliminar sensores de la colmena
    await conn.query("DELETE FROM sensores WHERE colmena_id = ?", [id]);

    // 3) Eliminar la colmena
    const [delColmena] = await conn.query(
      "DELETE FROM colmenas WHERE id = ?",
      [id]
    );

    await conn.commit();
    conn.release();

    return res.json({
      ok: true,
      forced: true,
      deleted: delColmena.affectedRows,
      id,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (e) {}
    conn.release();
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
    const [rows] = await pool.query(
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
      WHERE c.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Colmena no encontrada" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener colmena:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
