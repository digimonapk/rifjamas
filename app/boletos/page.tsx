"use client";

import React, { useMemo, useState } from "react";

type PayMethod = "pago_movil" | "zelle" | "binance";

type BankOption = { value: string; label: string };

const BANKS: BankOption[] = [
  { value: "", label: "SELECCIONE EL BANCO" },
  { value: "zell", label: "Zelle" },
  { value: "0000", label: "Banco Extranjero" },
  { value: "0102", label: "(0102) Banco de Venezuela, S.A. Banco Universal" },
  {
    value: "0104",
    label: "(0104) Banco Venezolano de Crédito, S.A. Banco Universal",
  },
  { value: "0105", label: "(0105) Banco Mercantil C.A., Banco Universal" },
  { value: "0108", label: "(0108) Banco Provincial, S.A. Banco Universal" },
  { value: "0114", label: "(0114) Banco del Caribe C.A., Banco Universal" },
  { value: "0115", label: "(0115) Banco Exterior C.A., Banco Universal" },
  { value: "0128", label: "(0128) Banco Caroní C.A., Banco Universal" },
  { value: "0134", label: "(0134) Banesco Banco Universal, C.A." },
  { value: "0137", label: "(0137) Banco Sofitasa Banco Universal, C.A ." },
  { value: "0138", label: "(0138) Banco Plaza, Banco universal" },
  { value: "0146", label: "(0146) Banco de la Gente Emprendedora C.A." },
  { value: "0151", label: "(0151) Banco Fondo Común, C.A Banco Universal" },
  { value: "0156", label: "(0156) 100% Banco, Banco Comercial, C.A" },
  { value: "0157", label: "(0157) DelSur, Banco Universal C.A." },
  { value: "0163", label: "(0163) Banco del Tesoro C.A., Banco Universal" },
  {
    value: "0166",
    label: "(0166) Banco Agrícola de Venezuela C.A., Banco Universal",
  },
  { value: "0168", label: "(0168) Bancrecer S.A., Banco Microfinanciero" },
  { value: "0169", label: "(0169) Mi Banco, Banco Microfinanciero, C.A." },
  { value: "0171", label: "(0171) Banco Activo C.A., Banco Universal" },
  { value: "0172", label: "(0172) Bancamiga Banco Universal, C.A." },
  {
    value: "0173",
    label: "(0173) Banco Internacional de Desarrollo C.A., Banco Universal",
  },
  { value: "0174", label: "(0174) Banplus Banco Universal, C.A." },
  {
    value: "0007",
    label: "(0175) Banco Bicentenario del Pueblo, Banco Universal C.A.",
  },
  {
    value: "0177",
    label:
      "(0177) BanFanb Banco de la Fuerza Armada Nacional Bolivariana, B.U.",
  },
  {
    value: "0178",
    label: "(0178) N58 Banco Digital, Banco Microfinanciero",
  },
  {
    value: "0191",
    label: "(0191) Banco Nacional de Crédito C.A., Banco Universal",
  },
];

const MIN_TICKETS = 5;

export default function RaffleUI() {
  const quickTop = [5, 7, 10];
  const quickBottom = [25, 50, 100];

  const [selectedQuantity, setSelectedQuantity] = useState<number>(MIN_TICKETS);
  const [customQuantity, setCustomQuantity] = useState<string>("");
  const [method, setMethod] = useState<PayMethod>("pago_movil");

  // form
  const [dni, setDni] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [ref, setRef] = useState("");
  const [bank, setBank] = useState("");

  // api ui
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ IMPORTANTE: al cargar la página, mostramos términos
  const [overlayOpen, setOverlayOpen] = useState(true);
  const [showTerms, setShowTerms] = useState(true);

  const [generatedTickets, setGeneratedTickets] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string>("");

  // Precio demo (ajústalo)
  const pricePerTicket = 290;

  const finalQty = useMemo(() => {
    const raw = customQuantity.trim();
    if (!raw) return selectedQuantity;

    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) return selectedQuantity;
    return Math.floor(n);
  }, [customQuantity, selectedQuantity]);

  const total = useMemo(() => finalQty * pricePerTicket, [finalQty]);

  const handleQuick = (q: number) => {
    setSelectedQuantity(Math.max(MIN_TICKETS, q));
    setCustomQuantity("");
  };

  const handleMinus = () => {
    setSelectedQuantity((v) => Math.max(MIN_TICKETS, v - 1));
    setCustomQuantity("");
  };

  const handlePlus = () => {
    setSelectedQuantity((v) => v + 1);
    setCustomQuantity("");
  };

  const clampQuantityOnBlur = () => {
    const raw = customQuantity.trim();
    if (!raw) {
      setSelectedQuantity((v) => Math.max(MIN_TICKETS, v));
      return;
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setCustomQuantity(String(Math.max(MIN_TICKETS, selectedQuantity)));
      return;
    }

    const clamped = Math.max(MIN_TICKETS, Math.floor(n));
    setCustomQuantity(String(clamped));
  };

  const copyBankData = async () => {
    const text =
      "0191 - BNC (Banco Nacional de Credito)\nJ-506607131\n04120727504";
    try {
      await navigator.clipboard.writeText(text);
      alert("✅ Datos copiados");
    } catch {
      alert("No se pudo copiar. Copia manualmente.");
    }
  };

  const onBuy = async () => {
    setApiError("");

    const qty = Math.max(0, finalQty);
    if (qty < MIN_TICKETS) {
      alert(`❌ Debes comprar mínimo ${MIN_TICKETS} tickets.`);
      return;
    }

    if (!proof) {
      alert("❌ Ingrese su comprobante de pago.");
      return;
    }
    if (!bank) {
      alert("❌ Seleccione el banco emisor.");
      return;
    }

    try {
      setIsSubmitting(true);

      const fd = new FormData();
      fd.append("dni", dni);
      fd.append("fullName", fullName);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("ref", ref);
      fd.append("bank", bank);
      fd.append("method", method);
      fd.append("quantity", String(qty));
      fd.append("proof", proof);

      const res = await fetch("/api/report-payment", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        const msg = json?.message || "Error al procesar";
        setApiError(msg);
        alert("❌ " + msg);
        return;
      }

      const tickets: string[] = json?.data?.tickets || [];
      setGeneratedTickets(tickets);

      // ✅ Al comprar OK: mostramos overlay pero en modo tickets (no términos)
      setShowTerms(false);
      setOverlayOpen(true);
    } catch (e: any) {
      const msg = e?.message || "Error de red";
      setApiError(msg);
      alert("❌ " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container-fluid px-4 py-3">
        <div className="row g-3">
          {/* LEFT PANEL */}
          <div className="col-12 col-lg-7">
            <div className="w-100">
              <div className="text-center font-bold text-white mb-2">
                Elige la cantidad de Tickets
              </div>

              <div className="row g-2">
                {quickTop.map((q) => (
                  <div key={q} className="col-4">
                    <button
                      type="button"
                      onClick={() => handleQuick(q)}
                      className="w-100 py-3 border border-white rounded bg-black text-white font-bold"
                      style={{ height: 56 }}
                    >
                      {q}
                    </button>
                  </div>
                ))}
                {quickBottom.map((q) => (
                  <div key={q} className="col-4">
                    <button
                      type="button"
                      onClick={() => handleQuick(q)}
                      className="w-100 py-3 border border-white rounded bg-black text-white font-bold"
                      style={{ height: 56 }}
                    >
                      {q}
                    </button>
                  </div>
                ))}
              </div>

              <div className="row g-2 mt-2 align-items-center">
                <div className="col-4">
                  <button
                    type="button"
                    onClick={handleMinus}
                    className="w-100 rounded border-0 font-black text-2xl"
                    style={{
                      height: 44,
                      background: "#d60000",
                      color: "white",
                    }}
                  >
                    -
                  </button>
                </div>

                <div className="col-4">
                  <input
                    className="form-control text-center fw-bold"
                    style={{
                      height: 44,
                      background: "white",
                      color: "black",
                      borderRadius: 4,
                    }}
                    value={
                      customQuantity.trim() ? customQuantity : String(finalQty)
                    }
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    onBlur={clampQuantityOnBlur}
                    inputMode="numeric"
                  />
                  <div
                    className="text-white-50 text-center"
                    style={{ fontSize: 11 }}
                  >
                    Mínimo {MIN_TICKETS}
                  </div>
                </div>

                <div className="col-4">
                  <button
                    type="button"
                    onClick={handlePlus}
                    className="w-100 rounded border-0 font-black text-2xl"
                    style={{
                      height: 44,
                      background: "#00a000",
                      color: "white",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between mt-2">
                <div>
                  <div className="text-white text-sm font-bold">Monto Bs</div>
                  <div className="text-white text-sm font-bold">
                    Métodos de Pago
                  </div>
                </div>
                <div className="text-white text-sm font-bold">
                  {total.toFixed(2)} BS
                </div>
              </div>

              <div className="d-flex gap-4 align-items-end mt-3">
                <PayIcon
                  label="Pago Movil"
                  active={method === "pago_movil"}
                  onClick={() => setMethod("pago_movil")}
                >
                  <div className="w-10 h-10 rounded-full border border-white bg-black d-flex align-items-center justify-content-center">
                    <span className="text-xs font-black">BNC</span>
                  </div>
                </PayIcon>

                <PayIcon
                  label="Zelle"
                  active={method === "zelle"}
                  onClick={() => setMethod("zelle")}
                >
                  <div className="w-10 h-10 rounded-full border border-white bg-black d-flex align-items-center justify-content-center">
                    <span className="text-xs font-black">Z</span>
                  </div>
                </PayIcon>

                <PayIcon
                  label="Binance"
                  active={method === "binance"}
                  onClick={() => setMethod("binance")}
                >
                  <div className="w-10 h-10 rounded-full border border-white bg-black d-flex align-items-center justify-content-center">
                    <span className="text-xs font-black">B</span>
                  </div>
                </PayIcon>
              </div>

              <div
                className="mt-3 w-100 text-black fw-bold text-center"
                style={{
                  background: "yellow",
                  padding: "10px 12px",
                  borderRadius: 2,
                }}
              >
                0191 - BNC (Banco Nacional de Credito) J-506607131 / 04120727504
              </div>

              <button
                type="button"
                onClick={copyBankData}
                className="w-100 mt-1 border-0 fw-bold"
                style={{
                  background: "#1976ff",
                  color: "white",
                  height: 34,
                  borderRadius: 2,
                }}
              >
                Copiar Datos
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-12 col-lg-5">
            <div className="w-100">
              <div className="mb-2">
                <label className="form-label text-white mb-1">Cédula</label>
                <input
                  className="form-control"
                  placeholder="Cédula (6 - 8 dígitos)"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-white mb-1">
                  Nombre completo
                </label>
                <input
                  className="form-control"
                  placeholder="Escriba su nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-white mb-1">Correo</label>
                <input
                  className="form-control"
                  placeholder="Escriba su correo de uso diario"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-white mb-1">
                  Teléfono/Whatsapp
                </label>
                <input
                  className="form-control"
                  placeholder="Escriba su nro de Whatsapp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-white mb-1">
                  Capture Bancario
                </label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label text-white mb-1">
                  Referencia Bancaria (Últimos 6 Dígitos)
                </label>
                <input
                  className="form-control"
                  placeholder="últimos 6 dígitos de la referencia"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                />
              </div>

              <div className="mb-1">
                <div className="text-white text-xs fw-bold">
                  ELIJA EL BANCO DESDE EL CUAL HIZO EL PAGO MOVIL
                </div>

                <select
                  className="form-select mt-1"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                >
                  {BANKS.map((b) => (
                    <option key={b.value || "empty"} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>

                <div className="text-white-50" style={{ fontSize: 11 }}>
                  Verificar correctamente el banco emisor
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BUY BAR */}
        <div className="mt-3">
          <button
            type="button"
            onClick={onBuy}
            disabled={isSubmitting}
            className="w-100 border-0 fw-bold"
            style={{
              background: "#0a7a0a",
              color: "white",
              height: 44,
              borderRadius: 0,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Procesando..." : "Comprar ✅"}
          </button>
          <div className="d-flex justify-content-center mt-3">
            <a
              href="verificador"
              className="fw-bold text-decoration-none d-flex align-items-center justify-content-center w-100"
              style={{
                background: "#FFD600", // amarillo
                color: "#000000", // letras negras
                height: 44,
                borderRadius: 4,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Verificar
            </a>
          </div>
        </div>

        {/* bottom image */}
        <div className="d-flex justify-content-center mt-5">
          <div
            className="rounded"
            style={{
              width: 200,
              height: 220,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.95,
            }}
          >
            <img
              src="logo_jamas.png"
              alt="logo"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        </div>
      </div>

      {/* ✅ OVERLAY - TÉRMINOS Y CONDICIONES AL CARGAR */}
      {overlayOpen && showTerms && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            background: "rgba(0,0,0,0.90)",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-black border border-white rounded-3"
            style={{
              width: "min(600px, 95vw)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-bottom border-secondary">
              <h4 className="m-0 fw-bold text-white">Términos y Condiciones</h4>
            </div>

            {/* Content - Scrollable */}
            <div className="px-4 py-4 overflow-y-auto" style={{ flex: 1 }}>
              <div
                className="text-white"
                style={{ fontSize: 14, lineHeight: 1.8 }}
              >
                <p className="mb-3">
                  <strong>1.-</strong> Los números disponibles para la compra en
                  cada una de nuestros sorteos se especificarán en la página de
                  detalles correspondientes a cada sorteo.
                </p>

                <p className="mb-3">
                  <strong>2.-</strong> Los tickets serán enviados en un lapso de
                  24 horas. Tenemos un alto volumen de pagos por procesar.
                </p>

                <p className="mb-3">
                  <strong>3.-</strong> Solo podrán participar en nuestros
                  sorteos personas naturales mayores de 18 años con nacionalidad
                  venezolana o extranjeros que residan legalmente en Venezuela.
                </p>

                <p className="mb-3">
                  <strong>4.-</strong> Los premios deberán ser retirados en
                  persona en la ubicación designada para cada Sorteo. solo
                  realizará entregas personales en la dirección indicada por el
                  ganado del primer premio o premio mayor.
                </p>

                <p className="mb-3">
                  <strong>5.-</strong> La compra mínima requerida para
                  participar en nuestros sorteos es de un ticket. Los tickets
                  serán asignados de manera aleatoria y los recibirás a través
                  del correo electrónico proporcionado.
                </p>

                <p className="mb-3">
                  <strong>6.-</strong> Para reclamar tu premio tienes un lapso
                  de 72 horas.
                </p>

                <p className="mb-3">
                  <strong>7.-</strong> Los ganadores aceptan aparecer en el
                  contenido audio visual de el sorteo mostrando su presencia en
                  las redes y entrega de los premios. Esto es{" "}
                  <strong>OBLIGATORIO</strong>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-top border-secondary">
              <button
                className="btn w-100 fw-bold py-3"
                style={{
                  background: "#4c1d95",
                  color: "white",
                  border: "none",
                  fontSize: 16,
                }}
                onClick={() => {
                  // ✅ aquí está el cambio real
                  setOverlayOpen(false); // cerrar overlay
                  setShowTerms(false); // ya aceptó términos
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ OVERLAY - TICKETS (solo si hay tickets) */}
      {overlayOpen && !showTerms && generatedTickets.length > 0 && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-dark border border-secondary rounded-3 shadow-lg"
            style={{
              width: "min(900px, 95vw)",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-secondary">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 40,
                    height: 40,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                  }}
                >
                  <span style={{ fontSize: 24 }}>✓</span>
                </div>
                <div>
                  <h4 className="m-0 fw-bold text-white">Tus Tickets</h4>
                  <p className="m-0 text-white-50" style={{ fontSize: 13 }}>
                    {generatedTickets.length} ticket
                    {generatedTickets.length !== 1 ? "s" : ""} generado
                    {generatedTickets.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setOverlayOpen(false);
                  setShowTerms(false);
                }}
                style={{ minWidth: 80 }}
              >
                Cerrar
              </button>
            </div>

            {/* Content */}
            <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
              <div
                className="alert alert-info mb-4"
                style={{
                  background: "#1e3a5f",
                  borderColor: "#2563eb",
                  color: "#93c5fd",
                }}
              >
                <strong>💡 Importante:</strong> Guarda estos números. Te los
                hemos enviado también por correo.
              </div>

              <div className="row g-3">
                {generatedTickets.map((t, idx) => (
                  <div key={t} className="col-12 col-sm-6 col-lg-3">
                    <div
                      className="position-relative"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
                        border: "2px solid #333",
                        borderRadius: 12,
                        padding: "16px 12px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        minHeight: 90,
                      }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(t);
                          const el = document.getElementById(`ticket-${idx}`);
                          if (el) {
                            el.style.borderColor = "#10b981";
                            setTimeout(
                              () => (el.style.borderColor = "#333"),
                              500
                            );
                          }
                        } catch {}
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#555";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(0,0,0,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#333";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      id={`ticket-${idx}`}
                    >
                      <div
                        className="text-white-50 mb-1"
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Ticket #{idx + 1}
                      </div>
                      <div
                        className="text-white text-center fw-bold"
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: 15,
                          letterSpacing: 1.2,
                          wordBreak: "break-all",
                          lineHeight: 1.5,
                        }}
                        title={`Clic para copiar: ${t}`}
                      >
                        {t}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-top border-secondary bg-dark">
              <div className="d-flex gap-2">
                <button
                  className="btn w-100 fw-bold"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    border: "none",
                    padding: "12px",
                  }}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        generatedTickets.join("\n")
                      );
                      alert("✅ Todos los tickets copiados al portapapeles");
                    } catch {
                      alert("❌ No se pudo copiar. Intenta de nuevo.");
                    }
                  }}
                >
                  📋 Copiar Todos los Tickets
                </button>

                <button
                  className="btn btn-success w-100 fw-bold"
                  onClick={() => setOverlayOpen(false)}
                  style={{ padding: "12px" }}
                >
                  ✓ Entendido
                </button>
              </div>
            </div>

            {apiError && (
              <div className="alert alert-danger mx-4 mb-3">{apiError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PayIcon({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-0 bg-transparent p-0"
      style={{ cursor: "pointer" }}
    >
      <div className="d-flex flex-column align-items-center">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            transform: active ? "scale(1.05)" : "scale(1)",
            opacity: active ? 1 : 0.9,
          }}
        >
          {children}
        </div>
        <div className="text-white" style={{ fontSize: 11, marginTop: 4 }}>
          {label}
        </div>
      </div>
    </button>
  );
}
