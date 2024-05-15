import { IRequest } from "itty-router";
import { JWK, JWTPayload } from "jose";
export interface Env {
  BUCKET: R2Bucket;
  SALAD_USERNAME: string;
  SALAD_PASSWORD: string;
  AUTH_URL: string;
  REQUIRE_PAYMENT_METHOD: string;
  TEST_API_KEY?: string;
  TEST_ORG?: string;
  JWKS_URL: string;
  orgId?: string;
}

export interface ApiKeyValidationResponse {
  is_api_key_valid: boolean;
  is_organization_name_valid: boolean;
  is_payment_method_attached: boolean;
  organization_id: string;
  organization_name: string;
}

export type CFArgs = [Env, ExecutionContext];

export type AuthedRequest = {
  orgId: string;
} & IRequest;

export interface JWKS {
  keys: JWK[];
}

export interface SaladJWTPayload extends JWTPayload {
  salad_machine_id: string;
  salad_organization_id: string;
  salad_organization_name: string;
  salad_workload_id: string;
  salad_workload_name: string;
}
