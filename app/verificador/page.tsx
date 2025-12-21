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
  if (s === "rejected") return "RECHAZADO";
  return "PENDIENTE";
}

function statusClass(s: string) {
  if (s === "confirmed") return "bg-green-100 text-green-800 border-green-300";
  if (s === "rejected") return "bg-red-100 text-red-800 border-red-300";
  return "bg-yellow-100 text-yellow-800 border-yellow-300";
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
              <div className="text-5xl text-purple-700 tracking-wide">
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
                  background: "#6bb26a", // verde similar a tu captura
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Buscando..." : "🔍 Buscar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER (como tu imagen) */}
      <footer className="bg-black text-white py-10">
        <div className="text-center space-y-4">
          <div className="text-sm opacity-90">Términos y Condiciones</div>

          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center">
              <span className="text-xl">⌁</span>
            </div>
          </div>

          <div className="text-xs text-purple-500">
            Copyright © 2024. Desarrollado por SOFTVENCA
          </div>
        </div>
      </footer>

      {/* OVERLAY RESULT */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="font-black text-lg">Resultado</div>
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="p-5">
              {!resp ? (
                <div>Cargando...</div>
              ) : resp.ok === false ? (
                <div className="alert alert-danger mb-0">
                  <b>Error:</b> {resp.error}
                  {resp.details ? (
                    <div className="mt-1">{resp.details}</div>
                  ) : null}
                </div>
              ) : resp.found === false ? (
                <div className="alert alert-warning mb-0">
                  {resp.message || "No se encontraron boletos para esa cédula."}
                </div>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                    <div className="fw-bold">
                      {resp.data?.fullName || "Sin nombre"}
                    </div>
                    <span className="text-muted">•</span>
                    <div className="text-muted">Cédula: {resp.data?.dni}</div>
                    <span className="text-muted">•</span>
                    <span
                      className={`px-3 py-1 rounded-full border text-sm font-bold ${statusClass(
                        resp.data?.status || "pending"
                      )}`}
                    >
                      {statusLabel(resp.data?.status || "pending")}
                    </span>
                  </div>

                  <div className="text-sm text-muted mb-2">
                    ID: <code>{resp.data?.id}</code>
                    {resp.data?.createdAt ? (
                      <>
                        {" "}
                        • Fecha:{" "}
                        {new Date(resp.data.createdAt).toLocaleString()}
                      </>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <div className="fw-bold mb-2">Tus boletos:</div>

                    <div className="d-flex flex-wrap gap-2">
                      {(resp.data?.tickets || []).map((t) => (
                        <span
                          key={t}
                          className="px-3 py-2 rounded-xl border fw-bold"
                          style={{
                            background: "#0b1220",
                            color: "#34d399",
                            borderColor: "#22c55e",
                            fontSize: 16,
                            letterSpacing: 0.5,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted">
                    {resp.data?.bank ? <>Banco: {resp.data.bank} • </> : null}
                    {resp.data?.referenceNumber ? (
                      <>Referencia: {resp.data.referenceNumber}</>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
