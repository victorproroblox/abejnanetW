// backend/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Solo para debug (no imprime la contraseña)
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "definida ✅" : "NO definida ❌");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // URL completa de Render
  ssl: {
    rejectUnauthorized: false, // necesario casi siempre en Render
  },

  // opciones del pool
  max: 10,                     // conexiones máximas
  idleTimeoutMillis: 30000,    // tiempo máximo inactiva
  connectionTimeoutMillis: 5000, // timeout al conectar
});

// Test de conexión
pool
  .connect()
  .then((client) => {
    console.log("✅ Conectado correctamente a la base de datos");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Error de conexión:", err.message);
  });

// Cierre limpio cuando mates el server (Ctrl+C)
const shutdown = async () => {
  try {
    await pool.end();
    console.log("👋 Pool PostgreSQL cerrado.");
  } catch (e) {
    console.error("Error cerrando pool:", e.message);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = pool;
