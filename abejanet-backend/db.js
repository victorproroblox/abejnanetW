// backend/db.js
const { Pool } = require("pg");

// Render ya inyecta las variables, no necesitas dotenv en producción
// require("dotenv").config();

console.log("→ DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // IMPORTANTE:
  // Si usas *Internal Database URL* SOLO:
  ssl: false

  // Si usas *External Database URL* (la que trae sslmode=require):
  // ssl: { rejectUnauthorized: false }
});

// Test de conexión (opcional)
pool.connect()
  .then(client => {
    console.log("✅ Conectado a PostgreSQL en Render");
    client.release();
  })
  .catch(err => {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
  });

module.exports = pool;
