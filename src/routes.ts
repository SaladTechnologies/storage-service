import { RequestHandler, IRequest, error } from "itty-router";
import { CFArgs, AuthedRequest, AccessTokenData, Env } from "./types";

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

  let url = new URL(
    `/organizations/${request.organization_name}/files/${filename}`,
    getBaseUrl(request)
  ).toString();

  const sign = formData.get("sign");
  const sigExp =
    formData.get("signatureExp") || env.DEFAULT_SIGNATURE_DURATION_SECONDS;
  if (sign && typeof sign !== "string") {
    return error(400, "Invalid sign parameter. Must be a string");
  }
  if (sigExp && typeof sigExp !== "string") {
    return error(400, "Invalid signatureExp parameter. Must be a string");
  }
  const createSignature = sign && sign.toLowerCase() === "true";
  if (createSignature) {
    const exp = parseInt(sigExp);
    const minExp = parseInt(env.MINIMUM_SIGNATURE_DURATION_SECONDS);
    const maxExp = parseInt(env.MAXIMUM_SIGNATURE_DURATION_SECONDS);
    const expError = validateExpiration(exp, minExp, maxExp);
    if (expError) {
      return expError;
    }
    const data: AccessTokenData = {
      orgId: request.orgId,
      orgName: request.organization_name,
      filename,
      method: "GET",
    };
    const token = await stashToken(env, data, exp);
    url += `?token=${token}`;
  }

  return { url };
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

export const validateExpiration = (
  exp: any,
  min: number,
  max: number
): Response | undefined => {
  if (typeof exp !== "number") {
    exp = parseInt(exp);
  }
  if (isNaN(exp)) {
    return error(400, "Invalid expiration time. Must be an integer");
  }
  if (exp < min || exp > max) {
    return error(
      400,
      `Expiration time must be between ${min} and ${max} (seconds)`
    );
  }
};

export const stashToken = async (
  env: Env,
  data: AccessTokenData,
  exp: number
): Promise<string> => {
  const token = crypto.randomUUID();
  await env.TOKEN_CACHE.put(token, JSON.stringify(data), {
    expirationTtl: exp,
  });
  return token;
};

export const signFile: RequestHandler<AuthedRequest, CFArgs> = async (
  request,
  env,
  ctx
) => {
  const filename = request.filename;
  const key = `${request.orgId}/${filename}`;

  const minExp = parseInt(env.MINIMUM_SIGNATURE_DURATION_SECONDS);
  const maxExp = parseInt(env.MAXIMUM_SIGNATURE_DURATION_SECONDS);

  const { exp = env.DEFAULT_SIGNATURE_DURATION_SECONDS, method = "GET" } =
    request.content;

  const expError = validateExpiration(exp, minExp, maxExp);
  if (expError) {
    return expError;
  }

  if (method !== "GET") {
    return error(400, "Invalid method. Must be GET");
  }

  const exists = await env.BUCKET.head(key);
  if (!exists) {
    return new Response("File not found", { status: 404 });
  }

  const data: AccessTokenData = {
    orgId: request.orgId,
    orgName: request.organization_name,
    filename,
    method,
  };
  const token = await stashToken(env, data, exp);

  const url = new URL(
    `/organizations/${request.organization_name}/files/${filename}?token=${token}`,
    getBaseUrl(request)
  ).toString();

  return { url };
};
