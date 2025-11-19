const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


// 🔐 Rutas

// 🔐 Rutas de autenticación

const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// 🐝 Rutas de colmenas
const colmenasRoutes = require("./routes/colmenas");
app.use("/api", colmenasRoutes);


const lecturasRoutes = require("./routes/lecturas");
app.use("/api", lecturasRoutes);
// 🐝 Rutas de usuario
const usuariosRoutes = require("./routes/usuarios");
app.use("/api", usuariosRoutes);

// 📡 Rutas de sensores
const sensoresRoutes = require("./routes/sensores");
app.use("/api", sensoresRoutes);

// 📡 Rutas de sensores
const apiariosRoutes = require("./routes/apiarios");
app.use("/api", apiariosRoutes);

// 📊 Rutas de reportes (nuevo)
const reportesRouter = require("./routes/reportes");
app.use("/api/reportes", reportesRouter);


// ✅ Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {

  console.log(`Servidor backend escuchando en el puerto:${PORT}`);
});

  



