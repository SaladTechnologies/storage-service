import { Env, ApiKeyValidationResponse } from "./types";

export function paymentRequired(env: Env): boolean {
  return env.REQUIRE_PAYMENT_METHOD.toLowerCase() === "true";
}

export async function validateSaladApiKey(
  env: Env,
  apiKey: string,
  orgName: string
): Promise<ApiKeyValidationResponse> {
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

export async function authRequest(
  request: Request & { params: { organization_name: string } },
  env: Env
) {
  const apiKey = request.headers.get("Salad-Api-Key");
  const orgName = request.params.organization_name;

  if (!apiKey) {
    return new Response("Missing API Key", { status: 401 });
  }

  try {
    const payload = await validateSaladApiKey(env, apiKey, orgName);
    env.orgId = payload.organization_id;
  } catch (e: any) {
    return new Response(e.message, { status: 401 });
  }
}
