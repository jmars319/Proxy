import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readSuiteEndpointConfig } from "@proxy/config";
import { handleShapeExternalOutputPayload } from "./src/shaping-api";
import {
  readPersistedSuiteProfilePresetOverrides,
  writePersistedSuiteProfilePresetOverrides
} from "./src/suite-profile-store";

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
          const origin = request.headers.origin;
          const allowedOrigins = readSuiteEndpointConfig(process.env).allowedOrigins;
          const originAllowed = !origin || allowedOrigins.includes(origin);

          if (origin && originAllowed) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Vary", "Origin");
          }
          response.setHeader("Access-Control-Allow-Headers", "Content-Type");
          response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

          if (request.method === "OPTIONS") {
            response.statusCode = originAllowed ? 204 : 403;
            response.end();
            return;
          }

          if (request.method !== "POST") {
            next();
            return;
          }

          if (!originAllowed) {
            response.statusCode = 403;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: ["Origin is not allowed for Proxy suite shaping."] }));
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

        server.middlewares.use("/api/suite-profile-overrides", async (request, response, next) => {
          if (request.method !== "GET" && request.method !== "POST") {
            next();
            return;
          }

          try {
            const overrides =
              request.method === "POST"
                ? writePersistedSuiteProfilePresetOverrides(
                    JSON.parse((await readRequestBody(request)) || "{}").overrides ?? {}
                  )
                : readPersistedSuiteProfilePresetOverrides();
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: true, overrides }, null, 2));
          } catch (error) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: [error instanceof Error ? error.message : "Suite profile store failed."] }));
          }
        });

        server.middlewares.use("/api/suite-health", async (request, response, next) => {
          if (request.method !== "GET") {
            next();
            return;
          }

          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(
            JSON.stringify(
              {
                ok: true,
                app: "tenra Proxy",
                checkedAt: new Date().toISOString(),
                endpoints: {
                  shapeExternalOutput: "/api/shape-external-output",
                  suiteProfileOverrides: "/api/suite-profile-overrides"
                },
                allowedOrigins: readSuiteEndpointConfig(process.env).allowedOrigins
              },
              null,
              2
            )
          );
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
