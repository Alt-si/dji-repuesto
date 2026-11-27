// Busca la foto real de un repuesto por su código en tiendas de repuestos DJI Agras.
//  GET  ?codigo=YC.JG.ZS005016[&nombre=...]  -> candidatos (público, solo lectura)
//  POST {accion:"lote"} con cabecera x-secreto -> procesa el siguiente lote de la lista
//       y guarda la foto exacta en los productos que todavía no tienen foto.
// Solo se considera "exacta" una foto cuyo SKU o título contiene el código del repuesto.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-secreto",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const WOO = ["https://volitantdrones.com", "https://www.enterra.sk", "https://cultivdron.com"];
const SHOP = ["https://shop.agrispraydrones.com", "https://store.uniteduav.com", "https://terra-xplore.com"];
const LISTA = "https://alt-si.github.io/dji-repuesto/data.json";

type Cand = { url: string; titulo: string; sku: string; fuente: string; pagina: string; exacto?: boolean };

const norm = (s: unknown) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const limpiar = (s: unknown) => String(s ?? "").replace(/&#8211;/g, "-").replace(/&amp;/g, "&").replace(/&#0?39;|&#8217;/g, "'").replace(/<[^>]+>/g, "").trim();

async function getJson(url: string, ms = 8000): Promise<any> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; ListaRepuestos/1.0)", Accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function woo(base: string, code: string): Promise<Cand[]> {
  const j = await getJson(`${base}/wp-json/wc/store/products?search=${encodeURIComponent(code)}&per_page=5`);
  if (!Array.isArray(j)) return [];
  return j.map((p: any) => ({
    url: p?.images?.[0]?.src || "", titulo: limpiar(p?.name), sku: String(p?.sku || ""),
    fuente: new URL(base).hostname, pagina: String(p?.permalink || base),
  })).filter((x: Cand) => x.url.startsWith("https://"));
}

async function shop(base: string, code: string): Promise<Cand[]> {
  const j = await getJson(`${base}/search/suggest.json?q=${encodeURIComponent(code)}&resources[type]=product&resources[limit]=4`);
  const ps: any[] = j?.resources?.results?.products || [];
  const out = await Promise.all(ps.map(async (p) => {
    let sku = "";
    if (p?.handle) {
      const d = await getJson(`${base}/products/${p.handle}.js`);
      if (Array.isArray(d?.variants)) sku = d.variants.map((v: any) => v?.sku || "").join(" ");
    }
    let url = String(p?.image || p?.featured_image?.url || "");
    if (url.startsWith("//")) url = "https:" + url;
    return { url, titulo: limpiar(p?.title), sku, fuente: new URL(base).hostname, pagina: base + String(p?.url || "").split("?")[0] };
  }));
  return out.filter((x) => x.url.startsWith("https://"));
}

async function buscar(code: string): Promise<Cand[]> {
  const n = norm(code);
  if (n.length < 5) return [];
  const listas = await Promise.all([...WOO.map((b) => woo(b, code)), ...SHOP.map((b) => shop(b, code))]);
  const PRIO = ["cultivdron.com", "www.enterra.sk", "shop.agrispraydrones.com", "volitantdrones.com", "terra-xplore.com", "store.uniteduav.com"];
  const todos = listas.flat().map((c) => {
    const skus = [...new Set(c.sku.split(/[\s,;/]+/).map(norm).filter(Boolean))];
    const coincide = skus.some((s) => s.startsWith(n)) || norm(c.titulo).includes(n);
    // una página con muchos códigos es un diagrama/kit: sirve de referencia, pero no es la foto del repuesto
    const exacto = coincide && skus.length <= 3;
    return { ...c, exacto, coincide, nSkus: skus.length };
  });
  const vistos = new Set<string>();
  const puntaje = (c: any) => (c.exacto ? 0 : c.coincide ? 100 : 200) + PRIO.indexOf(c.fuente) + 1;
  return todos.filter((c) => (vistos.has(c.url) ? false : (vistos.add(c.url), true)))
    .sort((a, b) => puntaje(a) - puntaje(b));
}

let LISTA_CACHE: { id: string; c: string }[] | null = null;
const idOf = (c: string) => c.trim().replace(/[^A-Za-z0-9_.~:@+-]/g, "_").replace(/^\.{1,2}$/, "_");

async function lote(n = 20) {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  if (!LISTA_CACHE) {
    const r = await getJson(LISTA, 15000);
    if (!Array.isArray(r)) throw new Error("No se pudo leer la lista de productos.");
    LISTA_CACHE = r.map((x: any) => ({ id: idOf(String(x.c)), c: String(x.c) }));
  }
  const hechos = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("fotos_auto").select("id").range(from, from + 999);
    if (error) throw error;
    data.forEach((r: any) => hechos.add(r.id));
    if (data.length < 1000) break;
  }
  const pendientes = LISTA_CACHE.filter((x) => !hechos.has(x.id)).slice(0, n);
  let encontradas = 0;
  const trabajar = async (x: { id: string; c: string }) => {
    const cands = await buscar(x.c).catch(() => []);
    const ex = cands.find((c) => c.exacto);
    if (ex) {
      const { data: cur } = await sb.from("edits").select("data").eq("id", x.id).maybeSingle();
      const d = (cur?.data as Record<string, unknown>) || { id: x.id };
      if (!d.img) {
        await sb.from("edits").upsert({ id: x.id, data: { ...d, img: ex.url, imgFuente: ex.pagina, t: Date.now(), por: "Búsqueda automática" }, updated_at: new Date().toISOString() });
        encontradas++;
      }
    }
    await sb.from("fotos_auto").upsert({ id: x.id, codigo: x.c, estado: ex ? "encontrada" : "sin_foto", url: ex?.url ?? null, fuente: ex?.pagina ?? null, candidatos: cands.length, intentado: new Date().toISOString() });
  };
  for (let i = 0; i < pendientes.length; i += 5) await Promise.all(pendientes.slice(i, i + 5).map(trabajar));
  return { procesados: pendientes.length, encontradas, faltan: LISTA_CACHE.length - hechos.size - pendientes.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") {
      const u = new URL(req.url);
      const codigo = (u.searchParams.get("codigo") || "").slice(0, 60);
      if (!codigo) return json({ error: "Falta el código." }, 400);
      return json({ codigo, candidatos: await buscar(codigo) });
    }
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.accion === "buscar") {
        const codigo = String(body.codigo || "").slice(0, 60);
        return json({ codigo, candidatos: await buscar(codigo) });
      }
      if (body?.accion === "lote") {
        const sbs = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
        const { data: s } = await sbs.from("ajustes_privados").select("valor").eq("clave", "secreto_fotos").maybeSingle();
        if (!s?.valor || req.headers.get("x-secreto") !== s.valor) return json({ error: "No autorizado." }, 401);
        return json(await lote(Math.min(40, Number(body.n) || 20)));
      }
    }
    return json({ error: "Acción desconocida." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
