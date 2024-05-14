import { expect, it, describe } from "vitest";
import { env } from "cloudflare:test";
import { validateSaladApiKey, paymentRequired } from "./middleware";
import { Env } from "./types";
declare module "cloudflare:test" {
  interface ProvidedEnv {
    NAMESPACE: KVNamespace;
  }

  // ...or if you have an existing `Env` type...
  interface ProvidedEnv extends Env {}
}

describe("validateSaladApiKey", () => {
  it("Returns a validation object if the api key and org are valid", async () => {
    const payload = await validateSaladApiKey(
      env,
      env.TEST_API_KEY!,
      env.TEST_ORG!
    );
    expect(payload.is_api_key_valid).toBe(true);
    expect(payload.is_organization_name_valid).toBe(true);

    if (paymentRequired(env)) {
      expect(payload.is_payment_method_attached).toBe(true);
    }
  });

  it("Throws an error if the api key is invalid", async () => {
    await expect(
      validateSaladApiKey(
        env,
        "f841b514-d167-4655-a029-ce4d391cba10",
        env.TEST_ORG!
      )
    ).rejects.toThrow("Invalid API Key");
  });

  it("Throws an error if the org name is invalid", async () => {
    await expect(
      validateSaladApiKey(env, env.TEST_API_KEY!, "invalid-org-name")
    ).rejects.toThrow("Invalid Organization Name");
  });
});
