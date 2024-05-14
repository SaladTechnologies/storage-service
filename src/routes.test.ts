import { IRequest } from "itty-router";
import { getBaseUrl } from "./routes";
import { expect, it, describe } from "vitest";
import { env } from "cloudflare:test";
import router from "./index";

describe("getBaseUrl", () => {
  it("Returns the base URL of the request", () => {
    const request = new Request("https://example.com/path");
    expect(getBaseUrl(request as IRequest)).toBe("https://example.com");
  });

  it("Returns the base URL of the request with a port", () => {
    const request = new Request("https://example.com:3000/path");
    expect(getBaseUrl(request as IRequest)).toBe("https://example.com:3000");
  });

  it("Respects protocol", () => {
    const request = new Request("http://localhost:8787/something");
    expect(getBaseUrl(request as IRequest)).toBe("http://localhost:8787");
  });
});

describe("POST /organizations/:organization_id/files", () => {
  it("Uploads a file to the bucket", async () => {
    const file = "somecontent";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("extension", "txt");
    formData.append("mimeType", "text/plain");

    const request = new Request("https://example.com/organizations/123/files", {
      method: "POST",
      body: formData,
      headers: {
        "Salad-Api-Key": env.TEST_API_KEY!,
      },
    });

    const response = await router.fetch(request, env);

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.url).toBeDefined;
    expect(body.url).toContain("https://example.com/organizations/123/files");
  });
});
