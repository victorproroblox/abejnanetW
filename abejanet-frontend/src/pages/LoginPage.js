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

  // Carga correo recordado (si existe)
  useEffect(() => {
    const savedEmail = localStorage.getItem("abejanet_email");
    if (savedEmail) setCorreo(savedEmail);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/api/login", {
        correo_electronico: correo,
        contrasena,
      });

      const { token, usuario } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      // recuerda o limpia el correo
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
      {/* capa de patrón hexagonal */}
      <div className="hex-bg" aria-hidden="true" />
      <section className="login-card">
        <header className="header">
          <img src={logo} alt="Logo AbejaNet" className="logo" />
          <h1 className="title">Bienvenido a AbejaNet</h1>
          <p className="subtitle">Cuidemos tus colmenas con datos y precisión</p>
        </header>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {/* Correo */}
          <div className="field">
            <label htmlFor="correo" className="label">Correo electrónico</label>
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
            <label htmlFor="contrasena" className="label">Contraseña</label>
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
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
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
              <span>Recuérdame</span>
            </label>

            <a href="#" className="link">¿Olvidaste tu contraseña?</a>
          </div>

          {/* Error */}
          {error && <div className="alert" role="alert">{error}</div>}

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
            <span className="btn-text">{loading ? "Ingresando..." : "Entrar"}</span>
          </button>
        </form>

        <footer className="footer">
          <p className="mini">
            © {new Date().getFullYear()} AbejaNet — Salud para tus colmenas 🐝
          </p>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;
