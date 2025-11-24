import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import logo from "../assets/abeja_logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("abejanet_email");
    if (savedEmail) setCorreo(savedEmail);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://abejanet-backend-cplf.onrender.com/api/login",
        {
          correo_electronico: correo,
          contrasena,
        }
      );

      const { token, usuario } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      if (remember) {
        localStorage.setItem("abejanet_email", correo);
      } else {
        localStorage.removeItem("abejanet_email");
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-full" aria-label="Inicio de sesión AbejaNet">
      {/* overlay de panal */}
      <div className="login-overlay" aria-hidden="true" />

      <section className="login-shell">
        <div className="login-card">
          {/* Columna izquierda: branding / info */}
          <div className="login-hero">
            <img src={logo} alt="Logo AbejaNet" className="login-logo" />
            <h1 className="login-title">
              AbejaNet<span> Dashboard</span>
            </h1>
            <p className="login-subtitle">
              Monitoreo inteligente de colmenas, en tiempo real.
            </p>

            <ul className="login-bullets">
              <li>
                <i className="fas fa-wave-square" />
                Tendencias de peso y ambiente por colmena.
              </li>
              <li>
                <i className="fas fa-bell" />
                Alertas tempranas ante cambios bruscos.
              </li>
              <li>
                <i className="fas fa-cloud-download-alt" />
                Reportes descargables para tu operación.
              </li>
            </ul>

            <div className="login-meta">
              <span className="pill-meta">
                <i className="fas fa-shield-alt" /> Datos protegidos
              </span>
              <span className="pill-meta">
                <i className="fas fa-wifi" /> Acceso desde cualquier lugar
              </span>
            </div>
          </div>

          {/* Columna derecha: formulario */}
          <div className="login-panel">
            <header className="panel-head">
              <h2>Inicia sesión</h2>
              <p>Ingresa tus credenciales para acceder al panel.</p>
            </header>

            <form onSubmit={handleSubmit} className="form" noValidate>
              {/* Correo */}
              <div className="field">
                <label htmlFor="correo" className="label">
                  Correo electrónico
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope icon" aria-hidden="true" />
                  <input
                    id="correo"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="input"
                    placeholder="tucorreo@ejemplo.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    aria-invalid={!!error}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="field">
                <label htmlFor="contrasena" className="label">
                  Contraseña
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-lock icon" aria-hidden="true" />
                  <input
                    id="contrasena"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    className="input"
                    placeholder="••••••••"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                    minLength={6}
                    aria-invalid={!!error}
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={
                      showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    <i
                      className={`fas ${
                        showPass ? "fa-eye-slash" : "fa-eye"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Opciones */}
              <div className="row-between">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Recuérdame en este equipo</span>
                </label>

                <button
                  type="button"
                  className="link-btn"
                  onClick={() => alert("Recuperación pendiente de implementar")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="alert" role="alert">
                  {error}
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                className="btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <i className="fas fa-sign-in-alt" aria-hidden="true" />
                )}
                <span className="btn-text">
                  {loading ? "Ingresando..." : "Entrar al panel"}
                </span>
              </button>
            </form>

            <footer className="footer">
              <p className="mini">
                © {new Date().getFullYear()} AbejaNet · Salud para tus colmenas
                🐝
              </p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
