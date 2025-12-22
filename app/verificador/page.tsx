// app/verificador/page.tsx
"use client";

import React, { useMemo, useState } from "react";

type VerifyResponse =
  | { ok: false; error: string; details?: string }
  | {
      ok: true;
      found: boolean;
      message?: string;
      data?: {
        id: string;
        fullName: string;
        dni: string;
        status: "pending" | "confirmed" | "rejected" | string;
        tickets: number[];
        createdAt: string | null;
        totalAmount: number | null;
        bank: string | null;
        referenceNumber: string | null;
      };
    };

function statusLabel(s: string) {
  if (s === "confirmed") return "CONFIRMADO";
  if (s === "rejected") return "CONFIRMADO";
  return "CONFIRMADO";
}

function statusStyle(s: string) {
  if (s === "confirmed")
    return { bg: "#059669", color: "#fff", border: "#047857" };
  if (s === "rejected")
    return { bg: "#dc2626", color: "#fff", border: "#b91c1c" };
  return { bg: "#008b3aff", color: "#fff", border: "#069406ff" };
}

export default function VerificadorPage() {
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [resp, setResp] = useState<VerifyResponse | null>(null);

  const dniDigits = useMemo(() => (dni || "").replace(/\D/g, ""), [dni]);

  const onSearch = async () => {
    const v = dniDigits;

    if (!v || v.length < 6) {
      setResp({
        ok: false,
        error: "Ingrese una cédula válida (mínimo 6 dígitos)",
      });
      setOpen(true);
      return;
    }

    try {
      setLoading(true);

      const r = await fetch("/api/verify-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: v }),
      });

      const json = (await r.json()) as VerifyResponse;
      setResp(json);
      setOpen(true);
    } catch (e: any) {
      setResp({ ok: false, error: "No se pudo conectar", details: e?.message });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* MAIN */}
      <div className="min-h-[72vh] flex items-start justify-center pt-12 px-4">
        <div
          className="w-full max-w-3xl bg-white rounded-2xl border shadow-xl"
          style={{ boxShadow: "0 18px 50px rgba(0,0,0,.12)" }}
        >
          <div className="px-6 py-7">
            <h1 className="text-center font-black leading-none">
              <div className="text-center text-purple-700 tracking-wide">
                VERIFICADOR
              </div>
              <div className="text-3xl text-purple-700 tracking-wide mt-1">
                DE BOLETOS
              </div>
            </h1>

            <div className="mt-8">
              <input
                className="form-control w-full border rounded-lg py-3 px-4 text-lg"
                placeholder=""
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                inputMode="numeric"
              />
              <div className="text-center font-bold mt-2">
                Introduzca número de cédula
              </div>

              <button
                type="button"
                onClick={onSearch}
                disabled={loading}
                className="w-full mt-3 rounded-md py-3 font-bold text-white"
                style={{
                  background: "#6bb26a",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-black text-white py-10">
        <div className="text-center space-y-4">
          <div className="text-sm opacity-90">Términos y Condiciones</div>

          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center">
              <span className="text-xl">
                <img src="instagram.png" alt="" />
              </span>
            </div>
          </div>

          <div className="text-xs text-purple-500">
            Copyright © 2024. Desarrollado por SOFTVENCA
          </div>
        </div>
      </footer>

      {/* OVERLAY RESULT - VERSIÓN PROFESIONAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden"
            style={{
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-8 py-6 border-b"
              style={{ background: "#fafafa", borderColor: "#e5e7eb" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2
                    className="m-0 fw-bold"
                    style={{
                      fontSize: 24,
                      color: "#111827",
                      letterSpacing: "-0.025em",
                    }}
                  >
                    Resultado de Verificación
                  </h2>
                  <p
                    className="m-0 mt-1"
                    style={{ fontSize: 14, color: "#6b7280" }}
                  >
                    Información de boletos registrados
                  </p>
                </div>
                <button
                  className="btn btn-light border"
                  onClick={() => setOpen(false)}
                  style={{
                    minWidth: 100,
                    height: 40,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div
              className="px-8 py-6 overflow-y-auto"
              style={{ flex: 1, background: "#fff" }}
            >
              {!resp ? (
                <div className="text-center py-12">
                  <div
                    className="spinner-border"
                    role="status"
                    style={{ color: "#6366f1", width: 48, height: 48 }}
                  >
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3 text-muted">Procesando solicitud...</p>
                </div>
              ) : resp.ok === false ? (
                <div
                  className="rounded-lg p-6 border"
                  style={{
                    background: "#fef2f2",
                    borderColor: "#fecaca",
                    borderWidth: 2,
                  }}
                >
                  <div
                    className="fw-bold mb-2"
                    style={{ fontSize: 16, color: "#991b1b" }}
                  >
                    Error en la búsqueda
                  </div>
                  <div style={{ color: "#dc2626" }}>{resp.error}</div>
                  {resp.details && (
                    <div
                      className="mt-2"
                      style={{ fontSize: 13, color: "#ef4444" }}
                    >
                      {resp.details}
                    </div>
                  )}
                </div>
              ) : resp.found === false ? (
                <div
                  className="rounded-lg p-6 border"
                  style={{
                    background: "#fffbeb",
                    borderColor: "#fde68a",
                    borderWidth: 2,
                  }}
                >
                  <div
                    className="fw-bold mb-2"
                    style={{ fontSize: 16, color: "#92400e" }}
                  >
                    Sin resultados
                  </div>
                  <div style={{ color: "#b45309" }}>
                    {resp.message ||
                      "No se encontraron boletos registrados para esta cédula."}
                  </div>
                </div>
              ) : (
                <>
                  {/* Info del usuario */}
                  <div
                    className="rounded-lg p-6 mb-6 border"
                    style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}
                  >
                    <div className="row align-items-center g-4">
                      <div className="col-md-6">
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 8,
                          }}
                        >
                          Titular
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {resp.data?.fullName || "Sin nombre"}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                        >
                          Cédula de Identidad:{" "}
                          <span
                            className="fw-semibold"
                            style={{ color: "#374151" }}
                          >
                            {resp.data?.dni}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 8,
                          }}
                        >
                          Estado
                        </div>
                        <span
                          className="px-4 py-2 rounded fw-bold d-inline-block"
                          style={{
                            background: statusStyle(
                              resp.data?.status || "pending"
                            ).bg,
                            color: statusStyle(resp.data?.status || "pending")
                              .color,
                            fontSize: 14,
                            letterSpacing: "0.025em",
                            border: `2px solid ${
                              statusStyle(resp.data?.status || "pending").border
                            }`,
                          }}
                        >
                          {statusLabel(resp.data?.status || "pending")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tickets */}
                  <div className="mb-6">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h3
                          className="m-0 fw-bold"
                          style={{ fontSize: 18, color: "#111827" }}
                        >
                          Boletos Registrados
                        </h3>
                        <p
                          className="m-0 mt-1"
                          style={{ fontSize: 13, color: "#6b7280" }}
                        >
                          Total de {resp.data?.tickets.length || 0} boleto
                          {resp.data?.tickets.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        className="btn btn-sm border"
                        style={{
                          background: "#fff",
                          color: "#374151",
                          fontWeight: 600,
                          fontSize: 13,
                          padding: "6px 16px",
                        }}
                        onClick={async () => {
                          try {
                            const tickets = resp.data?.tickets || [];
                            await navigator.clipboard.writeText(
                              tickets.join("\n")
                            );
                            alert("Tickets copiados al portapapeles");
                          } catch {
                            alert("Error al copiar");
                          }
                        }}
                      >
                        Copiar todos
                      </button>
                    </div>

                    <div className="row g-3">
                      {(resp.data?.tickets || []).map((t, idx) => (
                        <div key={t} className="col-12 col-sm-6 col-lg-3">
                          <div
                            className="position-relative"
                            style={{
                              background: "#fff",
                              border: "2px solid #e5e7eb",
                              borderRadius: 8,
                              padding: "16px 12px",
                              transition: "all 0.15s ease",
                              cursor: "pointer",
                              minHeight: 90,
                            }}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(String(t));
                                const el = document.getElementById(
                                  `vticket-${idx}`
                                );
                                if (el) {
                                  el.style.borderColor = "#10b981";
                                  el.style.background = "#f0fdf4";
                                  setTimeout(() => {
                                    el.style.borderColor = "#e5e7eb";
                                    el.style.background = "#fff";
                                  }, 400);
                                }
                              } catch {}
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#9ca3af";
                              e.currentTarget.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.background = "#fff";
                            }}
                            id={`vticket-${idx}`}
                            title={`Clic para copiar: ${t}`}
                          >
                            <div
                              className="text-center mb-2"
                              style={{
                                fontSize: 10,
                                color: "#9ca3af",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Boleto {idx + 1}
                            </div>
                            <div
                              className="text-center fw-bold"
                              style={{
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
                                fontSize: 16,
                                letterSpacing: 1,
                                wordBreak: "break-all",
                                lineHeight: 1.6,
                                color: "#111827",
                              }}
                            >
                              {t}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info adicional */}
                  {(resp.data?.createdAt ||
                    resp.data?.bank ||
                    resp.data?.referenceNumber) && (
                    <div
                      className="rounded-lg p-5 border"
                      style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 12,
                        }}
                      >
                        Información de Transacción
                      </div>
                      <div className="row g-3">
                        {resp.data?.createdAt && (
                          <div className="col-md-4">
                            <div
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                marginBottom: 4,
                              }}
                            >
                              Fecha de registro
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#374151",
                              }}
                            >
                              {new Date(resp.data.createdAt).toLocaleDateString(
                                "es-VE",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                        )}
                        {resp.data?.bank && (
                          <div className="col-md-4">
                            <div
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                marginBottom: 4,
                              }}
                            >
                              Banco emisor
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#374151",
                              }}
                            >
                              {resp.data.bank}
                            </div>
                          </div>
                        )}
                        {resp.data?.referenceNumber && (
                          <div className="col-md-4">
                            <div
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                marginBottom: 4,
                              }}
                            >
                              Número de referencia
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#374151",
                                fontFamily: "monospace",
                              }}
                            >
                              {resp.data.referenceNumber}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
