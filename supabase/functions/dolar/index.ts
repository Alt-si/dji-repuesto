// Cotización del dólar oficial del Banco Nación (billete, compra y venta).
// GET -> devuelve la última cotización guardada; si tiene más de 15 minutos,
// la vuelve a leer de bna.com.ar (o de dolarapi.com si el banco no responde) y la guarda.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

async function texto(url: string, ms = 10000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; ListaRepuestos/1.0)" } });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function leerBNA() {
  const h = await texto("https://www.bna.com.ar/Personas");
  if (!h) return null;
  const i = h.indexOf("Dolar U.S.A");
  if (i < 0) return null;
  const tramo = h.slice(i, i + 400);
  const m = tramo.match(/<td>\s*([\d.,]+)\s*<\/td>\s*<td>\s*([\d.,]+)\s*<\/td>/);
  if (!m) return null;
  const f = h.slice(Math.max(0, i - 800), i).match(/fechaCot">\s*([\d/]+)/);
  const compra = num(m[1]), venta = num(m[2]);
  if (!(compra > 0 && venta > 0)) return null;
  return { compra, venta, fecha_banco: f ? f[1] : null, fuente: "Banco Nación (billete)" };
}

async function leerApi() {
  const t = await texto("https://dolarapi.com/v1/dolares/oficial");
  if (!t) return null;
  try {
    const j = JSON.parse(t);
    if (!(j.compra > 0)) return null;
    return { compra: Number(j.compra), venta: Number(j.venta), fecha_banco: j.fechaActualizacion ? String(j.fechaActualizacion).slice(0, 10).split("-").reverse().join("/") : null, fuente: "Oficial (dolarapi.com)" };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: actual } = await sb.from("cotizacion").select("*").eq("id", "oficial").maybeSingle();
    const viejo = !actual || Date.now() - new Date(actual.actualizado).getTime() > 15 * 60 * 1000;
    if (!viejo) return json(actual);
    const nuevo = (await leerBNA()) || (await leerApi());
    if (!nuevo) return json(actual ? { ...actual, desactualizado: true } : { error: "No se pudo leer la cotización." }, actual ? 200 : 502);
    const fila = { id: "oficial", ...nuevo, actualizado: new Date().toISOString() };
    await sb.from("cotizacion").upsert(fila);
    return json(fila);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
