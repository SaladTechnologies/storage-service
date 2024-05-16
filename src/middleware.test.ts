import { expect, it, describe } from "vitest";
import { env } from "cloudflare:test";
import { validateSaladApiKey } from "./middleware";
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
    expect(payload).toMatchObject({
      is_api_key_valid: true,
      is_organization_name_valid: true,
      is_payment_method_attached: true,
      is_payment_method_required: false,
      organization_id: env.TEST_ORG_ID!,
      organization_name: env.TEST_ORG!,
    });
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
