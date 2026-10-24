import assert from "node:assert/strict";
import fs from "node:fs/promises";

const [tree, alias, auth, gate] = await Promise.all([
  fs.readFile(new URL("../src/routeTree.gen.ts", import.meta.url), "utf8"),
  fs.readFile(new URL("../src/routes/ceo-growtj.tsx", import.meta.url), "utf8"),
  fs.readFile(new URL("../src/lib/auth-context.tsx", import.meta.url), "utf8"),
  fs.readFile(new URL("../src/components/AccessGate.tsx", import.meta.url), "utf8"),
]);

assert.match(tree, /\/ceo-growth/, "canonical CEO growth route must be generated");
assert.match(tree, /\/ceo-growtj/, "legacy typo alias must remain routable");
assert.match(alias, /redirect\(\{\s*to:\s*"\/ceo-growth",\s*replace:\s*true\s*\}\)/, "legacy typo route must redirect to canonical route");
assert.match(auth, /rpc\("get_my_workspace_role"\)/, "super-admin state must come from server-side role RPC");
assert.doesNotMatch(auth, /ceo@resofit\.fit/i, "CEO email must not be hardcoded into the client bundle");
assert.match(gate, /hasAssignedRole\s*\|\|\s*isSuperAdmin/, "assigned roles and server-verified super-admin must pass the entitlement gate");
assert.match(gate, /if \(loading\)/, "entitlement checks must wait for authentication/role resolution");
console.log("PASS canonical route and typo alias; server-verified super-admin; role-resolution gate ordering.");
