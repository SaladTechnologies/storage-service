import { IRequest } from "itty-router";
import { getBaseUrl } from "./routes";
import { expect, it, describe, beforeAll } from "vitest";
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

async function uploadFile(filename: string, file: string, mimeType: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mimeType", mimeType);

  const request = new Request(
    `https://example.com/organizations/${env.TEST_ORG}/files/${filename}`,
    {
      method: "PUT",
      body: formData,
      headers: {
        "Salad-Api-Key": env.TEST_API_KEY!,
      },
    }
  );

  return router.fetch(request, env);
}

beforeAll(async () => {
  // Clear the bucket
  const { objects } = await env.BUCKET.list();
  await Promise.all(objects.map((obj) => env.BUCKET.delete(obj.key)));
});

describe("PUT /organizations/:organization_name/files/:filename", () => {
  it("Uploads a file to the bucket", async () => {
    const file = "somecontent";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mimeType", "text/plain");

    const request = new Request(
      `https://example.com/organizations/${env.TEST_ORG}/files/content.txt`,
      {
        method: "PUT",
        body: formData,
        headers: {
          "Salad-Api-Key": env.TEST_API_KEY!,
        },
      }
    );

    const response = await router.fetch(request, env);

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.url).toBe(
      `https://example.com/organizations/${env.TEST_ORG}/files/content.txt`
    );
  });
});

describe("GET /organizations/:organization_name/files/:filename", () => {
  it("Downloads a file from the bucket", async () => {
    const createResponse = await uploadFile(
      "content.txt",
      "somecontent",
      "text/plain"
    );
    const upload = await createResponse.json();

    const request = new Request(upload.url, {
      headers: {
        "Salad-Api-Key": env.TEST_API_KEY!,
      },
    });

    const response = await router.fetch(request, env);

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(body).toBe("somecontent");
  });
});

describe("DELETE /organizations/:organization_name/files/:filename", () => {
  it("Deletes a file from the bucket", async () => {
    const createResponse = await uploadFile(
      "content.txt",
      "somecontent",
      "text/plain"
    );
    const upload = await createResponse.json();

    const request = new Request(upload.url, {
      method: "DELETE",
      headers: {
        "Salad-Api-Key": env.TEST_API_KEY!,
      },
    });

    const response = await router.fetch(request, env);

    expect(response.status).toBe(204);
  });

  it("Returns 204 even if the file does not exist", async () => {
    const request = new Request(
      `https://example.com/organizations/${env.TEST_ORG}/files/nonexistent.txt`,
      {
        method: "DELETE",
        headers: {
          "Salad-Api-Key": env.TEST_API_KEY!,
        },
      }
    );

    const response = await router.fetch(request, env);

    expect(response.status).toBe(204);
  });
});

describe("GET /organizations/:organization_name/files", () => {
  it("Lists all files in the bucket that belong to the org", async () => {
    await uploadFile("file1.txt", "file1content", "text/plain");
    await uploadFile("file2.txt", "file2content", "text/plain");

    const request = new Request(
      `https://example.com/organizations/${env.TEST_ORG}/files`,
      {
        headers: {
          "Salad-Api-Key": env.TEST_API_KEY!,
        },
      }
    );

    const response = await router.fetch(request, env);

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.files).toBeInstanceOf(Array);
    expect(body.files).toHaveLength(2);
    expect(body.files[0].url).toBe(
      `https://example.com/organizations/${env.TEST_ORG}/files/file1.txt`
    );
    expect(body.files[1].url).toBe(
      `https://example.com/organizations/${env.TEST_ORG}/files/file2.txt`
    );
  });
});
