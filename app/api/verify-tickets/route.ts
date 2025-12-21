// app/api/verify-tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

const MONGODB_URI =
  "mongodb+srv://digimonapk_db_user:6QuqQzYfgRASqe4l@cluster0.3htrzei.mongodb.net";
const MONGODB_DB_NAME = "raffle_db";
const MONGODB_COLLECTION = "tickets3";

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function normalizeEmail(v: string) {
  return (v || "").trim().toLowerCase();
}

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizeIdVariants(input: string) {
  const raw = String(input || "").trim();

  const prefix = (raw.match(/[VEJGP]/i)?.[0] || "").toUpperCase(); // V/E/J/G/P
  const digits = onlyDigits(raw);

  const variants = new Set<string>();

  if (digits) variants.add(digits); // "1231236"
  if (prefix && digits) {
    variants.add(`${prefix}${digits}`); // "V1231236"
    variants.add(`${prefix}-${digits}`); // "V-1231236"
  }

  // también agrega minúsculas por si lo guardaste así (mala práctica, pero pasa)
  for (const v of Array.from(variants)) variants.add(v.toLowerCase());

  return {
    raw,
    digits,
    prefix,
    variants: Array.from(variants),
    asNumber: digits ? Number(digits) : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // acepta {query:""} o {dni:""} o {email:""} etc
    const raw =
      body?.query ??
      body?.dni ??
      body?.email ??
      body?.value ??
      body?.search ??
      "";

    const query = String(raw || "").trim();
    if (!query) {
      return NextResponse.json(
        { ok: false, error: "Ingrese cédula o correo" },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB_NAME);
    const col = db.collection(MONGODB_COLLECTION);

    // -------------------------
    // 1) BUSCAR POR EMAIL
    // -------------------------
    const email = normalizeEmail(query);
    if (looksLikeEmail(email)) {
      // NOTA: si guardaste email con mayúsculas en DB, esto NO matchea.
      // En ese caso hay que normalizar al guardar (recomendado) o usar regex i (más lento).
      const docByEmail = await col.findOne(
        { email }, // ideal si en DB está normalizado
        { sort: { createdAt: -1 } as any }
      );

      if (docByEmail) {
        return NextResponse.json({
          ok: true,
          found: true,
          data: {
            id: String(docByEmail._id),
            fullName: docByEmail.fullName || "",
            dni:
              docByEmail.userIdNumber ||
              docByEmail.idNumber ||
              docByEmail.userDni ||
              "",
            email: docByEmail.email || null,
            status: docByEmail.status || "pending",
            tickets: Array.isArray(docByEmail.assignedTickets)
              ? docByEmail.assignedTickets
              : [],
            createdAt: docByEmail.createdAt
              ? new Date(docByEmail.createdAt).toISOString()
              : null,
            totalAmount: docByEmail.totalAmount ?? null,
            bank: docByEmail.bank ?? null,
            referenceNumber: docByEmail.referenceNumber ?? null,
          },
        });
      }

      // fallback: si no encontró email normalizado, intenta regex case-insensitive (más lento)
      const docByEmailRegex = await col.findOne(
        {
          email: {
            $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        },
        { sort: { createdAt: -1 } as any }
      );

      if (docByEmailRegex) {
        return NextResponse.json({
          ok: true,
          found: true,
          data: {
            id: String(docByEmailRegex._id),
            fullName: docByEmailRegex.fullName || "",
            dni:
              docByEmailRegex.userIdNumber ||
              docByEmailRegex.idNumber ||
              docByEmailRegex.userDni ||
              "",
            email: docByEmailRegex.email || null,
            status: docByEmailRegex.status || "pending",
            tickets: Array.isArray(docByEmailRegex.assignedTickets)
              ? docByEmailRegex.assignedTickets
              : [],
            createdAt: docByEmailRegex.createdAt
              ? new Date(docByEmailRegex.createdAt).toISOString()
              : null,
            totalAmount: docByEmailRegex.totalAmount ?? null,
            bank: docByEmailRegex.bank ?? null,
            referenceNumber: docByEmailRegex.referenceNumber ?? null,
          },
        });
      }

      return NextResponse.json(
        { ok: true, found: false, message: "No se encontraron boletos." },
        { status: 200 }
      );
    }

    // -------------------------
    // 2) BUSCAR POR CÉDULA (con V/E/J/G/P, guiones, minúsculas, número)
    // -------------------------
    const id = normalizeIdVariants(query);

    if (!id.digits || id.digits.length < 6 || id.digits.length > 12) {
      return NextResponse.json(
        { ok: false, error: "Ingrese una cédula válida o un correo válido" },
        { status: 400 }
      );
    }

    // Campos posibles donde lo pudiste guardar (porque tú mismo has variado nombres antes)
    const ID_FIELDS = ["userIdNumber", "idNumber", "dni", "cedula", "userDni"];

    // Construye OR por variantes string
    const orString: any[] = [];
    for (const field of ID_FIELDS) {
      orString.push({ [field]: { $in: id.variants } });
    }

    // Si por error lo guardaste como número
    const orNumber: any[] = [];
    if (Number.isFinite(id.asNumber)) {
      for (const field of ID_FIELDS) {
        orNumber.push({ [field]: id.asNumber });
      }
    }

    const filter: any = {
      $or: [...orString, ...orNumber],
    };

    let doc = await col.findOne(filter, { sort: { createdAt: -1 } as any });

    // FALLBACK: Si no encontró con variantes exactas, intenta regex case-insensitive
    if (!doc) {
      const orRegex: any[] = [];

      // Busca con regex: prefijo opcional + dígitos
      // Esto encontrará: v123456, V123456, v-123456, V-123456, 123456
      const regexPattern = id.prefix
        ? `^${id.prefix}[-]?${id.digits}$` // V-123456 o V123456
        : `^[VEJGP]?[-]?${id.digits}$`; // cualquier prefijo opcional + dígitos

      for (const field of ID_FIELDS) {
        orRegex.push({
          [field]: { $regex: regexPattern, $options: "i" },
        });
      }

      doc = await col.findOne(
        { $or: orRegex },
        { sort: { createdAt: -1 } as any }
      );
    }

    if (!doc) {
      return NextResponse.json(
        {
          ok: true,
          found: false,
          message: "No se encontraron boletos.",
          debug: {
            query,
            digits: id.digits,
            variantsTried: id.variants,
            collection: MONGODB_COLLECTION,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      found: true,
      data: {
        id: String(doc._id),
        fullName: doc.fullName || "",
        dni:
          doc.userIdNumber ||
          doc.idNumber ||
          doc.dni ||
          doc.cedula ||
          doc.userDni ||
          id.digits,
        email: doc.email || null,
        status: doc.status || "pending",
        tickets: Array.isArray(doc.assignedTickets) ? doc.assignedTickets : [],
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        totalAmount: doc.totalAmount ?? null,
        bank: doc.bank ?? null,
        referenceNumber: doc.referenceNumber ?? null,
      },
    });
  } catch (e: any) {
    console.error("verify-tickets error:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
