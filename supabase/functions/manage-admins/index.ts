import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPER_ADMIN_ROLE_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_USERNAME = "maadminhe";
const EMAIL_DOMAIN = "admins.internal";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: callerData, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerData?.user) return json({ error: "unauthorized" }, 401);

  let p: any;
  try { p = await req.json(); } catch { return json({ error: "invalid_body" }, 400); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: caller } = await admin.from("users").select("id, username, roles(code)").eq("auth_uid", callerData.user.id).maybeSingle();
  if (!caller || (caller as any).roles?.code !== "super_admin") return json({ error: "forbidden" }, 403);

  const action = String(p.action ?? "");

  if (action === "list") {
    const { data } = await admin.from("users").select("id, username, email, full_name, is_active, created_at").eq("role_id", SUPER_ADMIN_ROLE_ID).order("created_at");
    return json({ ok: true, admins: (data ?? []).map((u: any) => ({ ...u, is_owner: (u.username ?? "").toLowerCase() === OWNER_USERNAME, is_me: u.id === caller.id })) });
  }

  if (action === "create") {
    const username = String(p.username ?? "").trim();
    const password = String(p.password ?? "");
    const fullName = String(p.fullName ?? "").trim();
    if (!/^[A-Za-z0-9]{3,30}$/.test(username)) return json({ error: "invalid_username" }, 400);
    if (password.length < 6) return json({ error: "weak_password" }, 400);
    const { data: taken } = await admin.rpc("fn_is_username_taken", { p_username: username });
    if (taken) return json({ error: "username_taken" }, 409);
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: `${username.toLowerCase()}@${EMAIL_DOMAIN}`, password, email_confirm: true, user_metadata: { username, is_super_admin: true },
    });
    if (createErr || !created?.user) return json({ error: createErr?.message ?? "create_failed" }, 400);
    const { data: row, error: updErr } = await admin.from("users").update({ role_id: SUPER_ADMIN_ROLE_ID, full_name: fullName || username, username }).eq("auth_uid", created.user.id).select("id").single();
    if (updErr || !row) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: updErr?.message ?? "profile_failed" }, 500); }
    return json({ ok: true, userId: row.id });
  }

  const targetId = String(p.userId ?? "");
  const { data: target } = await admin.from("users").select("id, auth_uid, username, role_id").eq("id", targetId).maybeSingle();
  if (!target || target.role_id !== SUPER_ADMIN_ROLE_ID) return json({ error: "not_found" }, 404);
  const isOwner = (target.username ?? "").toLowerCase() === OWNER_USERNAME;

  if (action === "reset_password") {
    const newPassword = String(p.newPassword ?? "");
    if (newPassword.length < 6) return json({ error: "weak_password" }, 400);
    if (isOwner && caller.id !== target.id) return json({ error: "owner_protected" }, 403);
    if (target.id === caller.id) return json({ error: "use_own_password_form" }, 400);
    const { error } = await admin.auth.admin.updateUserById(target.auth_uid, { password: newPassword });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === "set_active") {
    if (isOwner) return json({ error: "owner_protected" }, 403);
    if (target.id === caller.id) return json({ error: "cannot_self" }, 400);
    const active = !!p.active;
    const { error } = await admin.auth.admin.updateUserById(target.auth_uid, { ban_duration: active ? "none" : "876000h" });
    if (error) return json({ error: error.message }, 400);
    await admin.from("users").update({ is_active: active }).eq("id", target.id);
    return json({ ok: true });
  }

  if (action === "delete") {
    if (isOwner) return json({ error: "owner_protected" }, 403);
    if (target.id === caller.id) return json({ error: "cannot_self" }, 400);
    const { error: delRowErr } = await admin.from("users").delete().eq("id", target.id);
    if (delRowErr) return json({ error: "in_use_deactivate_instead" }, 409);
    await admin.auth.admin.deleteUser(target.auth_uid);
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
});
