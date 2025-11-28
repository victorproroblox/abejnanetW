// backend/db.js
const { Pool } = require("pg");

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // necesario en Render
  },
  max: 10,                 // nº máximo de conexiones en el pool
  idleTimeoutMillis: 30000 // 30s inactiva -> Render puede cerrar sin bronca
});

// Prueba corta al arrancar
(async () => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");
    console.log("Conectado correctamente a la base de datos:", rows[0].now);
  } catch (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  }
})();

module.exports = pool;
