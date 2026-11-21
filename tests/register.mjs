// Lets `node --test` (Node >= 22.18 strips TypeScript types natively) load the
// app's TypeScript modules, which import each other without file extensions
// and with the "@/" alias, as Next.js does. No extra dependencies.
//
//   node --import ./tests/register.mjs --test tests/*.test.ts

import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const ROOT = pathToFileURL(resolvePath(import.meta.dirname, "..") + "/").href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(specifier.slice(2), ROOT).href;
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      const relative = specifier.startsWith(".") || specifier.startsWith("file:");
      if (err?.code !== "ERR_MODULE_NOT_FOUND" || !relative || /\.[cm]?[jt]sx?$/.test(specifier)) throw err;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
