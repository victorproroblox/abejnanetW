// backend/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

// Solo para revisar que .env sí se está leyendo (si quieres, puedes comentar esto)
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // buenas prácticas de pool
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // cómo devuelve datos
  dateStrings: true,      // DATE/DATETIME como string (evita pedos de zona horaria)
  decimalNumbers: true,   // DECIMAL como number
  namedPlaceholders: true // si usas :param en queries
  // timezone: "Z",       // si quieres forzar UTC, si no, déjalo comentado
});

// Test de conexión (opcional, pero chido para ver que jala)
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ Conectado correctamente a la base de datos:", process.env.DB_NAME);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Error de conexión:", err.message);
  });

// Cierre limpio cuando mates el server (Ctrl+C)
const shutdown = async () => {
  try {
    await pool.end();
    console.log("👋 Pool MySQL cerrado.");
  } catch (e) {
    console.error("Error cerrando pool:", e.message);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = pool;


