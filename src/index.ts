import { AutoRouter, withContent, cors, IRequest } from "itty-router";
import { AuthedRequest, CFArgs } from "./types";
import { uploadFile } from "./routes";

const { preflight, corsify } = cors();

const router = AutoRouter<IRequest, CFArgs>({
  before: [preflight],
  after: [corsify],
});

router.post<AuthedRequest>(
  "/organizations/:organization_name/files",
  withContent,
  uploadFile
);

export default { ...router };
