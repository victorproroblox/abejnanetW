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

const lecturasRoutes = require("./routes/lecturas");
app.use("/api", lecturasRoutes);



// ✅ Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
