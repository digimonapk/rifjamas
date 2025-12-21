"use client";

import React, { useMemo, useState } from "react";

type RaffleCard = {
  id: string;
  title: string;
  imageUrl: string;
  buyUrl: string;
  verifyUrl: string;
  dayLabel: string;
  monthLabel: string;
  availablePercent: number; // 0 - 100
};

const cardsSeed: RaffleCard[] = [
  {
    id: "fin-de-ano",
    title: "🎆 FIN DE AÑO 🎇",
    imageUrl: "01KCXYKPM2W7M6GV15JR50JM7D.webp", // pon tu ruta real
    buyUrl:
      "https://www.juanreinosomorles.com/comprar/2119c812-dd45-11f0-9843-405b7f92a4a4",
    verifyUrl:
      "https://www.juanreinosomorles.com/verificador/2119c812-dd45-11f0-9843-405b7f92a4a4",
    dayLabel: "29",
    monthLabel: "Diciembre",
    availablePercent: 90.72,
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function RifasJamasLanding() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const cards = useMemo(() => cardsSeed, []);
  const active = cards[activeIndex];

  const prev = () =>
    setActiveIndex((i) => (i - 1 + cards.length) % cards.length);
  const next = () => setActiveIndex((i) => (i + 1) % cards.length);

  const percent = clamp(active.availablePercent, 0, 100);

  return (
    <div className="min-h-screen text-white">
      {/* Fondo tipo hero-wrap */}
      <div
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url(fondo_jamas2.jpg)" }}
      >
        {/* Header */}
        <header className="absolute left-0 right-0 top-0 z-20">
          <div className="mx-auto flex max-w-6xl items-center justify-start px-4 py-4">
            <a
              href="https://www.juanreinosomorles.com/"
              className="inline-flex items-center gap-3"
              rel="noopener"
            >
              <img
                src="logo_jamas.png"
                alt="RifasJamas"
                className="h-16 w-16 rounded-full object-cover shadow-lg"
              />
            </a>
          </div>
        </header>

        {/* Capa oscura para legibilidad */}
        <div className="min-h-screen bg-black/55">
          {/* Main */}
          <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 pt-24 pb-10">
            <div className="w-full">
              {/* Slider simple */}
              <div className="flex items-center justify-center gap-4">
                {cards.length > 1 && (
                  <button
                    onClick={prev}
                    className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 transition"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                )}

                {/* Card */}
                <section className="w-full max-w-sm rounded-2xl bg-white text-black shadow-[0_15px_30px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                  {/* Imagen */}
                  <div className="relative h-72 bg-black/10">
                    <img
                      src={active.imageUrl}
                      alt={active.title}
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  {/* Título */}
                  <div className="px-5 pt-4">
                    <h1 className="text-center text-2xl font-black">
                      {active.title}
                    </h1>
                  </div>

                  {/* Botones */}
                  <div className="px-5 pt-4">
                    <div className="flex flex-col items-center gap-3">
                      <a
                        href={active.buyUrl}
                        className="w-full rounded-full bg-yellow-400 px-5 py-4 text-center font-extrabold text-black transition hover:scale-[1.02] active:scale-[0.99]"
                        rel="noopener"
                      >
                        COMPRAR TICKETS
                      </a>

                      <a
                        href={active.verifyUrl}
                        className="w-full rounded-full bg-[#efb810] px-5 py-4 text-center font-extrabold text-white transition hover:scale-[1.02] active:scale-[0.99]"
                        rel="noopener"
                      >
                        Verificar Ticket
                      </a>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 bg-[#efb810] text-white">
                    <div className="border-r border-white/10 px-4 py-5 text-center">
                      <div className="text-3xl font-black">
                        {active.dayLabel}
                      </div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/85">
                        {active.monthLabel}
                      </div>
                    </div>

                    <div className="px-4 py-5 text-center">
                      <div className="mx-auto h-9 w-full overflow-hidden rounded-lg bg-white/10">
                        <div
                          className="flex h-full items-center justify-center rounded-lg bg-white/20 text-xs font-black"
                          style={{ width: `${percent}%` }}
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          role="progressbar"
                        >
                          QUEDAN {percent.toFixed(2)}%
                        </div>
                      </div>

                      <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/85">
                        Disponible
                      </div>
                    </div>
                  </div>
                </section>

                {cards.length > 1 && (
                  <button
                    onClick={next}
                    className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 transition"
                    aria-label="Siguiente"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* Telegram flotante (lo llamas "whatsapp" pero es Telegram) */}
          <a
            href="https://t.me/rifasjamas"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-16 left-6 z-30 h-20 w-20"
            aria-label="Soporte en Telegram"
          >
            <img
              src="telegram.png"
              alt="Telegram soporte"
              className="h-20 w-20 object-contain drop-shadow-xl"
            />
          </a>

          {/* Footer */}
          <footer className="bg-[#000]">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={() => setTermsOpen(true)}
                  className="text-white/90 underline underline-offset-4 hover:text-white"
                >
                  Términos y Condiciones
                </button>

                <div className="flex items-center gap-3">
                  <a
                    href="https://www.instagram.com/rifasjamas/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-white/10 p-3 hover:bg-white/15 transition"
                    aria-label="Instagram"
                  >
                    <img
                      src="instagram.png"
                      alt="Instagram"
                      className="h-10 w-10"
                    />
                  </a>
                </div>

                <p className="text-center text-sm text-white/80">
                  Copyright © 2024. Desarrollado por{" "}
                  <a
                    href="https://www.instagram.com/softvencaoficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    SOFTVENCA
                  </a>
                </p>
              </div>
            </div>
          </footer>

          {/* Modal Términos */}
          {termsOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-xl rounded-2xl bg-black text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <h2 className="text-lg font-extrabold">
                    Términos y Condiciones
                  </h2>
                  <button
                    onClick={() => setTermsOpen(false)}
                    className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15 transition"
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 px-6 py-5 text-sm leading-relaxed text-white/90">
                  <p>
                    1.- Los números disponibles para la compra en cada uno de
                    nuestros sorteos se especificarán en la página de detalles
                    correspondientes a cada sorteo.
                  </p>
                  <p>
                    2.- Los tickets serán enviados en un lapso de 24 horas.
                    Tenemos un alto volumen de pagos por procesar.
                  </p>
                  <p>
                    3.- Solo podrán participar en nuestros sorteos personas
                    naturales mayores de 18 años con nacionalidad venezolana o
                    extranjeros que residan legalmente en Venezuela.
                  </p>
                  <p>
                    4.- Los premios deberán ser retirados en persona en la
                    ubicación designada para cada Sorteo.
                  </p>
                  <p>
                    5.- La compra mínima requerida para participar en nuestros
                    sorteos es de un ticket. Los tickets serán asignados de
                    manera aleatoria y los recibirás a través del correo
                    electrónico proporcionado.
                  </p>
                  <p>
                    6.- Para reclamar tu premio tienes un lapso de 72 horas.
                  </p>
                  <p>
                    7.- Los ganadores aceptan aparecer en el contenido
                    audiovisual del sorteo mostrando su presencia en redes y
                    entrega de premios. Esto es OBLIGATORIO.
                  </p>
                </div>

                <div className="flex justify-end border-t border-white/10 px-6 py-4">
                  <button
                    onClick={() => setTermsOpen(false)}
                    className="rounded-xl bg-violet-700 px-5 py-3 font-bold text-white hover:brightness-110 transition"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
