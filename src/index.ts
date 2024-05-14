import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { createCors } from "itty-router";
import { authRequest } from "./middleware";
import { Env } from "./types";

const router = OpenAPIRouter({
  schema: {
    info: {
      title: "🥗 Salad Storage Service",
      description:
        "A service to let you store files for use in other services.",
      version: "1.0.0",
    },
  },
});

const { preflight, corsify } = createCors({
  methods: ["GET", "POST", "DELETE"],
});

router.registry.registerComponent("securitySchemes", "apiKey", {
  type: "apiKey",
  in: "header",
  name: "Salad-Api-Key",
});

router.all("*", preflight);
router.all("*", authRequest);

export default {
  fetch: async (request: Request, env: Env, ctx: any) => {
    return router.handle(request, env, ctx).then(corsify);
  },
};
