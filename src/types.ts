export interface Env {
  BUCKET: R2Bucket;
  SALAD_USERNAME: string;
  SALAD_PASSWORD: string;
  AUTH_URL: string;
  REQUIRE_PAYMENT_METHOD: string;
  TEST_API_KEY?: string;
  TEST_ORG?: string;
  orgId?: string;
}

export interface ApiKeyValidationResponse {
  is_api_key_valid: boolean;
  is_organization_name_valid: boolean;
  is_payment_method_attached: boolean;
  organization_id: string;
  organization_name: string;
}
