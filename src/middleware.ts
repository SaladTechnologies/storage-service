import {
  Env,
  ApiKeyValidationResponse,
  AuthedRequest,
  SaladJWTPayload,
} from "./types";
import * as jose from "jose";
import { error } from "itty-router";
import { Buffer } from "node:buffer";

export function paymentRequired(env: Env): boolean {
  return env.REQUIRE_PAYMENT_METHOD.toLowerCase() === "true";
}

export async function validateSaladApiKey(
  env: Env,
  apiKey: string,
  orgName: string
): Promise<ApiKeyValidationResponse> {
  if (!apiKey || !orgName) {
    throw new Error("API Key and Organization Name Required");
  }
  const response = await fetch(env.AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(
        `${env.SALAD_USERNAME}:${env.SALAD_PASSWORD}`
      ).toString("base64")}`,
    },
    body: JSON.stringify({ api_key: apiKey, organization_name: orgName }),
  });

  if (!response.ok) {
    console.log(await response.json());
    throw new Error("Error Accessing Authentication Service");
  }

  const body = (await response.json()) as ApiKeyValidationResponse;

  if (!body.is_api_key_valid) {
    throw new Error("Invalid API Key");
  }

  if (!body.is_organization_name_valid) {
    throw new Error("Invalid Organization Name");
  }

  if (paymentRequired(env) && !body.is_payment_method_attached) {
    throw new Error("Payment Method Required");
  }

  return body;
}

export async function validateSaladJWT(
  env: Env,
  token: string
): Promise<SaladJWTPayload> {
  const jwks = jose.createRemoteJWKSet(new URL(env.JWKS_URL));

  const { payload } = await jose.jwtVerify(token, jwks);

  return payload as SaladJWTPayload;
}

export async function authRequest(request: AuthedRequest, env: Env) {
  const apiKey = request.headers.get("Salad-Api-Key");
  const authHeader = request.headers.get("Authorization");
  const orgName = request.organization_name;

  if (!apiKey && !authHeader) {
    return error(401, "API Key or JWT Required");
  }

  if (apiKey) {
    try {
      const payload = await validateSaladApiKey(env, apiKey, orgName);
      request.orgId = payload.organization_id;
    } catch (e: any) {
      return error(401, e.message);
    }
  } else if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = await validateSaladJWT(env, token);
      if (payload.salad_organization_name !== orgName) {
        return error(401, "Invalid Organization Name");
      }
      request.orgId = payload.salad_organization_id;
    } catch (e: any) {
      return new Response(e.message, { status: 401 });
    }
  }
}
