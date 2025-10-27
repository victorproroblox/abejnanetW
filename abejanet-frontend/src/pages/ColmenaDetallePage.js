import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FaWeight,
  FaMapMarkerAlt,
  FaChartLine,
  FaBalanceScale,
} from "react-icons/fa";
import "./ColmenaDetallePage.css";

function ColmenaDetallePage() {
  const { id } = useParams();
  const [colmena, setColmena] = useState(null);
  const [lecturas, setLecturas] = useState([]);
  const [pesoActual, setPesoActual] = useState(null);
  const [variacion, setVariacion] = useState(null);
  const [ultimaFecha, setUltimaFecha] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/colmenas/${id}/detalle`)
      .then((res) => {
        setColmena(res.data.colmena);

        const lecturasProcesadas = res.data.lecturas.map((l) => ({
          fecha: new Date(l.fecha_registro).getTime(),
          temperatura: l.temperatura ? parseFloat(l.temperatura) : null,
          humedad: l.humedad ? parseFloat(l.humedad) : null,
          peso: l.peso ? parseFloat(l.peso) : null,
        }));

        setLecturas(lecturasProcesadas);

        const ultima = lecturasProcesadas[0];
        const penultima = lecturasProcesadas[1];

        setPesoActual(ultima?.peso);
        setUltimaFecha(ultima?.fecha);
        if (ultima?.peso && penultima?.peso) {
          setVariacion(ultima.peso - penultima.peso);
        }
      })
      .catch((err) => {
        console.error("Error cargando detalles de colmena:", err);
      });
  }, [id]);

  const formatFecha = (ms) =>
    new Date(ms).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="detalle-colmena-page">
      {colmena && (
        <>
          <div className="info-grid">
            <div className="card-info">
              <FaBalanceScale size={24} />
              <div>
                <h3>Colmena:</h3>
                <p>{colmena.nombre}</p>
              </div>
            </div>

            <div className="card-info">
              <FaMapMarkerAlt size={24} />
              <div>
                <h3>Apiario:</h3>
                <p>{colmena.apiario}</p>
              </div>
            </div>
          </div>

          <div className="card-peso">
            <FaWeight size={32} />
            <div className="peso-detalle">
              <h2>Peso actual:</h2>
              <p className="valor">
                {pesoActual !== null && pesoActual !== undefined
                  ? pesoActual.toFixed(2) + " kg"
                  : "-"}
              </p>
              <p
                className={
                  variacion > 0
                    ? "positivo"
                    : variacion < 0
                    ? "negativo"
                    : "neutro"
                }
              >
                {variacion !== null && variacion !== undefined
                  ? (variacion > 0 ? "▲" : "▼") +
                    Math.abs(variacion).toFixed(2) +
                    " kg"
                  : "-"}
              </p>
              <span className="fecha">
                {ultimaFecha && formatFecha(ultimaFecha)}
              </span>
            </div>
          </div>

          <div className="grafica-panel">
            <h3>
              <FaChartLine /> Temperatura
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lecturas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  type="number"
                  tickFormatter={formatFecha}
                  domain={["auto", "auto"]}
                />
                <YAxis />
                <Tooltip labelFormatter={formatFecha} />
                <Line
                  type="monotone"
                  dataKey="temperatura"
                  stroke="#8884d8"
                  name="Temperatura (°C)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grafica-panel">
            <h3>
              <FaChartLine /> Humedad
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lecturas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  type="number"
                  tickFormatter={formatFecha}
                  domain={["auto", "auto"]}
                />
                <YAxis />
                <Tooltip labelFormatter={formatFecha} />
                <Line
                  type="monotone"
                  dataKey="humedad"
                  stroke="#82ca9d"
                  name="Humedad (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grafica-panel">
            <h3>
              <FaChartLine /> Peso
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lecturas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  type="number"
                  tickFormatter={formatFecha}
                  domain={["auto", "auto"]}
                />
                <YAxis />
                <Tooltip labelFormatter={formatFecha} />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="#ffc658"
                  name="Peso (kg)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default ColmenaDetallePage;
