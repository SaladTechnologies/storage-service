import { RequestHandler, IRequest, error } from "itty-router";
import { CFArgs, AuthedRequest } from "./types";

export const getBaseUrl = (request: IRequest): string => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

export const uploadFile: RequestHandler<AuthedRequest, CFArgs> = async (
  request,
  env,
  ctx
) => {
  if (!request.content) {
    return new Response("No file uploaded", { status: 400 });
  }

  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("multipart/form-data")) {
    return error(400, "Invalid content type. Must be multipart/form-data");
  }

  // Verify that request.content is a FormData object
  const formData = request.content as FormData;

  const file = formData.get("file");
  const filename = request.filename;
  const mimeType = formData.get("mimeType");

  if (!file || !filename) {
    return error(400, "No file uploaded");
  }

  let key = `${request.orgId}/${filename}`;

  let opts: R2PutOptions = !!mimeType
    ? {
        httpMetadata: {
          contentType: mimeType.toString(),
        },
      }
    : {};

  await env.BUCKET.put(key, file, opts);

  const url = new URL(
    `/organizations/${request.organization_name}/files/${filename}`,
    getBaseUrl(request)
  );

  return { url: url.toString() };
};

export const downloadFile: RequestHandler<AuthedRequest, CFArgs> = async (
  request,
  env,
  ctx
) => {
  const filename = request.filename;
  const key = `${request.orgId}/${filename}`;

  const file = await env.BUCKET.get(key);

  if (!file) {
    return new Response("File not found", { status: 404 });
  }

  const mimeType = file.httpMetadata?.contentType || "application/octet-stream";

  return new Response(file.body, {
    headers: {
      "content-type": mimeType,
    },
  });
};

export const deleteFile: RequestHandler<AuthedRequest, CFArgs> = async (
  request,
  env,
  ctx
) => {
  const filename = request.filename;
  const key = `${request.orgId}/${filename}`;

  try {
    await env.BUCKET.delete(key);
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
};

export const listFiles: RequestHandler<AuthedRequest, CFArgs> = async (
  request,
  env,
  ctx
) => {
  const prefix = `${request.orgId}/`;

  const { objects } = await env.BUCKET.list({
    prefix,
    include: ["httpMetadata"],
  });

  const files = objects.map((obj) => {
    const filename = obj.key.replace(prefix, "");
    return {
      url: new URL(
        `/organizations/${request.organization_name}/files/${filename}`,
        getBaseUrl(request)
      ).toString(),
      mimeType: obj.httpMetadata?.contentType || "application/octet-stream",
      size: obj.size,
      uploaded: obj.uploaded,
      etag: obj.etag,
    };
  });
  return { files };
};
