import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MongoClient, ObjectId } from "mongodb";

export const runtime = "nodejs";

/**
 * ✅ Variables por ENV (no hardcode)
 * En Vercel/Hostinger/tu .env.local:
 * TELEGRAM_BOT_TOKEN=
 * TELEGRAM_CHAT_ID=
 * SMTP_HOST=smtp.hostinger.com
 * SMTP_PORT=465
 * SMTP_SECURE=true
 * SMTP_USER=
 * SMTP_PASS=
 * EMAIL_FROM="Gana con Ivan" <...>
 * MONGODB_URI=
 * MONGODB_DB_NAME=raffle_db
 * MONGODB_COLLECTION=tickets
 * TICKET_PRICE=290
 * BASE_URL=https://www.ganaconivan.shop
 */

const TELEGRAM_BOT_TOKEN = "8051878604:AAG-Uy5xQyBtYRAXnWbEHgSJaxJw69UvAHQ";
const TELEGRAM_CHAT_ID = "-5034114704";

const SMTP_HOST = "smtp.hostinger.com";
const SMTP_PORT = 465;
const SMTP_SECURE = true;
const SMTP_USER = "tickets@juanreinosmorles.com";
const SMTP_PASS = "Holas123@@"; // NO tu contraseña normal
const EMAIL_FROM = `"Rifas Jamas" <${SMTP_USER}>`;

// MongoDB
const MONGODB_URI =
  "mongodb+srv://digimonapk_db_user:6QuqQzYfgRASqe4l@cluster0.3htrzei.mongodb.net"; // ejemplo: "mongodb://localhost:27017" o "mongodb+srv://user:pass@cluster.mongodb.net"
const MONGODB_DB_NAME = "raffle_db";
const MONGODB_COLLECTION = "tickets3";

const TICKET_PRICE = Number(process.env.TICKET_PRICE || 290);
const BASE_URL = process.env.BASE_URL || "https://www.juanreinosmorles.com/";

const MIN_TICKETS = 5;

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function pad6(n: number) {
  return String(n).padStart(6, "0");
}

function generateUnique6DigitTickets(count: number) {
  const set = new Set<string>();
  // evita colisiones dentro de la misma compra
  while (set.size < count) {
    const n = Math.floor(100000 + Math.random() * 900000);
    set.add(pad6(n));
  }
  return Array.from(set);
}

function buildTicketsEmailHTML(params: {
  fullName: string;
  quantity: number;
  totalAmount: number;
  bank: string;
  referenceNumber: string;
  ticketPrice: number;
  tickets: string[];
  transactionDate: string;
  transactionId: string;
}) {
  const {
    fullName,
    quantity,
    totalAmount,
    bank,
    referenceNumber,
    ticketPrice,
    tickets,
    transactionDate,
    transactionId,
  } = params;

  const ticketsHtml = (tickets || [])
    .map(
      (t) => `
      <span style="
        display:inline-block;
        padding:10px 14px;
        margin:6px 6px 0 0;
        background:#0f172a;
        color:#34d399;
        border:2px solid #22c55e;
        border-radius:12px;
        font-weight:800;
        font-size:18px;
        letter-spacing:1px;
      ">${escapeHtml(t)}</span>
    `
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b1220;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
      <div style="padding:18px 20px;border-bottom:1px solid #1f2937;display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:10px;background:#22c55e;"></div>
        <div>
          <div style="color:#fff;font-size:18px;font-weight:800;">Confirmación de compra</div>
          <div style="color:#9ca3af;font-size:12px;">Tus boletos ya están registrados</div>
        </div>
      </div>

      <div style="padding:20px;color:#e5e7eb;">
        <p style="margin:0 0 12px 0;">Hola <b>${escapeHtml(fullName)}</b>,</p>
        <p style="margin:0 0 18px 0;color:#cbd5e1;">
          Aquí tienes tus números asignados. Guárdalos.
        </p>

        <div style="background:#0f172a;border:1px solid #1f2937;border-radius:14px;padding:14px 16px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>ID Transacción</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(
              transactionId
            )}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Banco</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(bank)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Referencia</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(
              referenceNumber
            )}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Cantidad</span>
            <span style="color:#fff;font-weight:700;">${quantity}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Precio ticket</span>
            <span style="color:#fff;font-weight:700;">Bs. ${ticketPrice}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;">
            <span>Total</span>
            <span style="color:#34d399;font-weight:900;font-size:16px;">Bs. ${totalAmount}</span>
          </div>
          <div style="margin-top:10px;color:#64748b;font-size:12px;">
            Fecha: ${escapeHtml(transactionDate)}
          </div>
        </div>

        <div style="margin-bottom:10px;color:#9ca3af;font-size:13px;">Tus tickets:</div>
        <div style="margin-bottom:18px;">${ticketsHtml}</div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${BASE_URL}/${escapeHtml(
    transactionId
  )}" style="display:inline-block;padding:14px 32px;background:#22c55e;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 6px rgba(34,197,94,0.3);">
            🎟️ Ver mis boletos
          </a>
        </div>

        <div style="color:#94a3b8;font-size:12px;line-height:1.5;border-top:1px solid #1f2937;padding-top:14px;">
          Si no reconoces esta compra o hay un error en tus datos, responde a este correo.
        </div>
      </div>
    </div>
  </div>
  `;
}

function buildTicketsEmailText(params: {
  fullName: string;
  quantity: number;
  totalAmount: number;
  bank: string;
  referenceNumber: string;
  ticketPrice: number;
  tickets: string[];
  transactionDate: string;
  transactionId: string;
}) {
  const {
    fullName,
    quantity,
    totalAmount,
    bank,
    referenceNumber,
    ticketPrice,
    tickets,
    transactionDate,
    transactionId,
  } = params;

  return [
    "Confirmación de compra",
    `Hola ${fullName}`,
    "",
    `ID Transacción: ${transactionId}`,
    `Banco: ${bank}`,
    `Referencia: ${referenceNumber}`,
    `Cantidad: ${quantity}`,
    `Precio ticket: Bs. ${ticketPrice}`,
    `Total: Bs. ${totalAmount}`,
    `Fecha: ${transactionDate}`,
    "",
    `Tickets: ${(tickets || []).join(", ")}`,
    "",
    "Ver mis boletos:",
    `${BASE_URL}/${transactionId}`,
  ].join("\n");
}

async function sendTicketsEmail(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  await transporter.verify();

  return await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo: SMTP_USER,
  });
}

async function sendToTelegram(caption: string, file?: File | Blob) {
  if (!file) {
    const tgResp = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: caption,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    return await tgResp.json();
  }

  const fd = new FormData();
  fd.append("chat_id", TELEGRAM_CHAT_ID);
  fd.append("caption", caption);
  fd.append("parse_mode", "HTML");

  const fileName = (file as File)?.name || `comprobante-${Date.now()}.jpg`;
  fd.append("document", file, fileName);

  const tgResp = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
    { method: "POST", body: fd }
  );

  return await tgResp.json();
}

async function saveToMongoDB(doc: any) {
  const client = await connectToDatabase();
  const db = client.db(MONGODB_DB_NAME);
  const collection = db.collection(MONGODB_COLLECTION);

  const result = await collection.insertOne({
    ...doc,
    createdAt: new Date(),
    status: "pending", // pending | confirmed | rejected
  });

  return result.insertedId as ObjectId;
}

export async function POST(request: NextRequest) {
  try {
    // 1) leer formdata (del frontend)
    const formData = await request.formData();

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const dni = String(formData.get("dni") || "").trim();

    const bank = String(formData.get("bank") || "").trim();
    const referenceNumber = String(formData.get("ref") || "").trim(); // tu UI manda "ref"
    const paymentMethod = String(formData.get("method") || "").trim(); // tu UI manda "method"

    const quantity = Number(formData.get("quantity") || 0);

    // archivo (tu UI manda "proof")
    const proofFile = formData.get("proof") as File | null;

    // 2) validaciones
    if (!proofFile || (proofFile instanceof File && proofFile.size === 0)) {
      return NextResponse.json(
        { ok: false, message: "Ingrese su comprobante de pago" },
        { status: 400 }
      );
    }

    // si quieres forzar imagen:
    // if (proofFile instanceof File && !proofFile.type.startsWith("image/")) {
    //   return NextResponse.json({ ok: false, message: "El comprobante debe ser una imagen" }, { status: 400 });
    // }

    if (!bank) {
      return NextResponse.json(
        { ok: false, message: "Seleccione el banco emisor" },
        { status: 400 }
      );
    }

    if (!referenceNumber) {
      return NextResponse.json(
        { ok: false, message: "Ingrese la referencia bancaria" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity < MIN_TICKETS) {
      return NextResponse.json(
        { ok: false, message: `Debes comprar mínimo ${MIN_TICKETS} tickets` },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { ok: false, message: "Ingrese su nombre completo" },
        { status: 400 }
      );
    }

    // 3) generar tickets 6 dígitos
    const tickets = generateUnique6DigitTickets(quantity);

    // 4) server calcula total (no confíes en el frontend)
    const ticketPrice = TICKET_PRICE;
    const totalAmount = ticketPrice * quantity;

    const transactionDate = new Date().toISOString();

    // 5) guardar en Mongo
    let transactionId: ObjectId;
    try {
      transactionId = await saveToMongoDB({
        fullName,
        email,
        phone,
        dni,
        bank,
        referenceNumber,
        paymentMethod,
        quantity,
        ticketPrice,
        totalAmount,
        assignedTickets: tickets,
        transactionDate,
      });
    } catch (e: any) {
      console.error("❌ MongoDB error:", e);
      return NextResponse.json(
        {
          ok: false,
          message: "Error guardando en base de datos",
          details: e?.message,
        },
        { status: 500 }
      );
    }

    // 6) Telegram (con archivo)
    const caption =
      `🧾 <b>Nuevo reporte de pago</b>\n\n` +
      `🆔 <b>ID:</b> <code>${transactionId.toString()}</code>\n` +
      `👤 <b>Nombre:</b> ${escapeHtml(fullName)}\n` +
      `🪪 <b>Cédula:</b> ${escapeHtml(dni)}\n` +
      `📧 <b>Email:</b> ${escapeHtml(email)}\n` +
      `📱 <b>Teléfono:</b> ${escapeHtml(phone)}\n` +
      `🏦 <b>Banco:</b> ${escapeHtml(bank)}\n` +
      `🔢 <b>Referencia:</b> ${escapeHtml(referenceNumber)}\n` +
      `💳 <b>Método:</b> ${escapeHtml(paymentMethod)}\n` +
      `💰 <b>Total:</b> Bs. ${totalAmount}\n` +
      `🎟️ <b>Tickets (${tickets.length}):</b> ${escapeHtml(
        tickets.join(", ")
      )}`;

    try {
      const tgJson = await sendToTelegram(caption, proofFile);
      if (!tgJson?.ok) {
        console.error("❌ Telegram error:", tgJson);
        // si quieres que NO bloquee aunque Telegram falle, cambia a solo log y sigue
        return NextResponse.json(
          {
            ok: false,
            message: "No se pudo enviar a Telegram",
            telegram: tgJson,
          },
          { status: 502 }
        );
      }
    } catch (e: any) {
      console.error("❌ Telegram exception:", e);
      return NextResponse.json(
        {
          ok: false,
          message: "Error enviando a Telegram",
          details: e?.message,
        },
        { status: 502 }
      );
    }

    // 7) Email opcional (si falla, no bloquea)
    let emailStatus: "sent" | "skipped" | "failed" = "skipped";
    let emailError: string | null = null;

    try {
      if (email && email.length > 3) {
        const html = buildTicketsEmailHTML({
          fullName,
          quantity,
          totalAmount,
          bank,
          referenceNumber,
          ticketPrice,
          tickets,
          transactionDate,
          transactionId: transactionId.toString(),
        });

        const text = buildTicketsEmailText({
          fullName,
          quantity,
          totalAmount,
          bank,
          referenceNumber,
          ticketPrice,
          tickets,
          transactionDate,
          transactionId: transactionId.toString(),
        });

        await sendTicketsEmail(
          email,
          "✅ Confirmación - Tus números de la suerte",
          html,
          text
        );
        emailStatus = "sent";
      } else {
        emailStatus = "skipped";
      }
    } catch (e: any) {
      emailStatus = "failed";
      emailError = e?.message || String(e);
      console.error("❌ Email falló (pero continúo):", emailError);
    }

    // 8) responder al frontend (para overlay)
    return NextResponse.json({
      ok: true,
      message: "Pago registrado: DB OK, Telegram OK, Email opcional",
      data: {
        transactionId: transactionId.toString(),
        tickets, // <- overlay
        ticketCount: tickets.length,
        ticketPrice,
        totalAmount,
        emailStatus,
        emailError,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error crítico:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al procesar el reporte de pago",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
