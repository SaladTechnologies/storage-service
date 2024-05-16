import {
  Env,
  ApiKeyValidationResponse,
  AuthedRequest,
  SaladJWTPayload,
} from "./types";
import * as jose from "jose";
import { error } from "itty-router";
import { Buffer } from "node:buffer";

export async function validateSaladApiKey(
  env: Env,
  apiKey: string,
  orgName: string
): Promise<ApiKeyValidationResponse> {
  if (!apiKey || !orgName) {
    throw new Error("API Key and Organization Name Required");
  }
  const cacheKey = `${apiKey}:${orgName}`;
  const cacheTtl = parseInt(env.TOKEN_CACHE_TTL);
  const cached = await env.TOKEN_CACHE.get<ApiKeyValidationResponse>(cacheKey, {
    type: "json",
    cacheTtl,
  });

  if (cached) {
    return cached;
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

  if (body.is_payment_method_required && !body.is_payment_method_attached) {
    throw new Error("Payment Method Required");
  }

  await env.TOKEN_CACHE.put(cacheKey, JSON.stringify(body), {
    expirationTtl: cacheTtl,
  });

  return body;
}

export async function getJWKs(env: Env): Promise<jose.JSONWebKeySet> {
  const cacheKey = "jwks";
  const cacheTtl = parseInt(env.JWKS_CACHE_TTL);
  const cached = await env.TOKEN_CACHE.get<jose.JSONWebKeySet>(cacheKey, {
    type: "json",
    cacheTtl,
  });
  if (cached) {
    return cached;
  }

  const response = await fetch(env.JWKS_URL);
  if (!response.ok) {
    throw new Error("Error Accessing JWKS");
  }

  const body = (await response.json()) as jose.JSONWebKeySet;

  await env.TOKEN_CACHE.put(cacheKey, JSON.stringify(body), {
    expirationTtl: cacheTtl,
  });

  return body;
}

export async function validateSaladJWT(
  env: Env,
  token: string
): Promise<SaladJWTPayload> {
  const jwksRaw = await getJWKs(env);
  const jwks = jose.createLocalJWKSet(jwksRaw);

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
