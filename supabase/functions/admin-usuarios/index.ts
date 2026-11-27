// Administración de usuarios de la lista de repuestos.
// Lo llama la página: crear el administrador inicial (solo si no hay ninguno),
// y, para administradores, crear usuarios, cambiar contraseñas y eliminar usuarios.
// Hace su propia verificación de sesión (verify_jwt desactivado porque la página
// usa la clave publicable, que no es un JWT).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const emailOk = (e: unknown): e is string => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;
const claveOk = (p: unknown): p is string => typeof p === "string" && p.length >= 8 && p.length <= 72;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await req.json().catch(() => ({}));
    const accion = body?.accion;

    const { count } = await sb.from("editores").select("email", { count: "exact", head: true })
      .eq("rol", "admin").eq("activo", true);
    const hayAdmin = (count ?? 0) > 0;

    if (accion === "estado") return json({ hayAdmin });

    if (accion === "crear_admin_inicial") {
      if (hayAdmin) return json({ error: "Ya existe un administrador." }, 403);
      const email = String(body.email || "").trim().toLowerCase();
      if (!emailOk(email)) return json({ error: "Email no válido." }, 400);
      if (!claveOk(body.password)) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
      const nombre = String(body.nombre || "").trim().slice(0, 80) || null;
      const { error } = await sb.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { nombre } });
      if (error) return json({ error: error.message }, 400);
      const { error: e2 } = await sb.from("editores").upsert({ email, nombre, rol: "admin", activo: true });
      if (e2) return json({ error: e2.message }, 400);
      return json({ ok: true });
    }

    // Lo que sigue requiere un administrador con sesión iniciada
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    const yoEmail = u?.user?.email?.toLowerCase();
    if (!yoEmail) return json({ error: "Tu sesión venció. Ingresá de nuevo." }, 401);
    const { data: yo } = await sb.from("editores").select("rol,activo").eq("email", yoEmail).maybeSingle();
    if (!yo || yo.rol !== "admin" || !yo.activo) return json({ error: "Solo un administrador puede hacer esto." }, 403);

    const buscarId = async (email: string) => {
      for (let page = 1; page < 50; page++) {
        const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        const f = data.users.find((x) => (x.email || "").toLowerCase() === email);
        if (f) return f.id;
        if (data.users.length < 1000) return null;
      }
      return null;
    };

    const email = String(body.email || "").trim().toLowerCase();
    if (!emailOk(email)) return json({ error: "Email no válido." }, 400);

    if (accion === "crear_usuario") {
      if (!claveOk(body.password)) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
      const rol = body.rol === "admin" ? "admin" : "editor";
      const nombre = String(body.nombre || "").trim().slice(0, 80) || null;
      const existente = await buscarId(email);
      if (existente) {
        const { error } = await sb.auth.admin.updateUserById(existente, { password: body.password, email_confirm: true });
        if (error) return json({ error: error.message }, 400);
      } else {
        const { error } = await sb.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { nombre } });
        if (error) return json({ error: error.message }, 400);
      }
      const { error: e2 } = await sb.from("editores").upsert({ email, nombre, rol, activo: true });
      if (e2) return json({ error: e2.message }, 400);
      return json({ ok: true, existia: !!existente });
    }

    if (accion === "cambiar_clave") {
      if (!claveOk(body.password)) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
      const id = await buscarId(email);
      if (!id) return json({ error: "Ese usuario no tiene cuenta todavía." }, 404);
      const { error } = await sb.auth.admin.updateUserById(id, { password: body.password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (accion === "eliminar_usuario") {
      if (email === yoEmail) return json({ error: "No podés eliminar tu propio usuario." }, 400);
      const { error: e1 } = await sb.from("editores").delete().eq("email", email);
      if (e1) return json({ error: e1.message }, 400);
      const id = await buscarId(email);
      if (id) {
        const { error } = await sb.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true });
    }

    return json({ error: "Acción desconocida." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
