// Netlify Function: envuelve la app de Express existente (artifacts/api-server)
// para que corra como función serverless en vez de servidor persistente.
//
// Todo lo que llega a /api/* (ver redirects en netlify.toml) termina aquí.

import serverless from "serverless-http";
import app from "../../artifacts/api-server/src/app";

// serverless-http adapta el objeto Express (req/res) al formato que
// Netlify Functions espera (event/context -> response).
export const handler = serverless(app);
