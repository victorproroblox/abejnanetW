const mysql = require("mysql2/promise");
require("dotenv").config();
console.log("🔎 Variables de entorno:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
pool.getConnection()
  .then(conn => {
    console.log("✅ Conectado correctamente a la base de datos:", process.env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error de conexión:", err.message);
  });

module.exports = pool;

