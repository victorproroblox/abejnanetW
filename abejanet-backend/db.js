// backend/db.js
const { Pool } = require("pg");
require("dotenv").config();

// (En producción es mejor NO loguear credenciales, puedes comentar esto)
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // opciones del pool
  max: 10,                 // conexiones máximas
  idleTimeoutMillis: 30000, // tiempo máxima inactiva
  connectionTimeoutMillis: 2000, // timeout al conectar
});

// Test de conexión
pool
  .connect()
  .then((client) => {
    console.log("✅ Conectado correctamente a la base de datos:", process.env.DB_NAME);
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
