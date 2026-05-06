import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { handleShapeExternalOutputPayload } from "./src/shaping-api";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

function readRequestBody(request: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "proxy-suite-shaping-api",
      configureServer(server) {
        server.middlewares.use("/api/shape-external-output", async (request, response, next) => {
          if (request.method !== "POST") {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const payload = body.trim() ? JSON.parse(body) : {};
            const result = handleShapeExternalOutputPayload(payload);
            response.statusCode = result.ok ? 200 : 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(result, null, 2));
          } catch (error) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(
              JSON.stringify({
                ok: false,
                errors: [error instanceof Error ? error.message : "Shape request failed."]
              })
            );
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@web": path.resolve(currentDirectory, "src")
    }
  },
  server: {
    port: 4173
  }
});
