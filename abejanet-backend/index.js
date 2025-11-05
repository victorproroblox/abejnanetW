const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Rutas
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// 🐝 Rutas de colmenas
const colmenasRoutes = require("./routes/colmenas");
app.use("/api", colmenasRoutes);

// 🐝 Rutas de usuario
const usuariosRoutes = require("./routes/usuarios");
app.use("/api", usuariosRoutes);

// 📡 Rutas de sensores
const sensoresRoutes = require("./routes/sensores");
app.use("/api", sensoresRoutes);


// ✅ Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
