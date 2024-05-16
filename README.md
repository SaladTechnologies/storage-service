# 🥗 Salad Simple Storage Service (S4)

This is a simple HTTP service to allow Salad customers to temporarily upload assets for use in other salad services. Examples include uploading images for stable diffusion training or inference, audio clips for transcription, etc.

## Endpoints

### Authorization

Requests to the S4 service must include either:
- An `Salad-Api-Key` header with a valid Salad API key.
- An `Authorization` header with a valid Salad JWT (issued by the instance metadata service) as a bearer token.

### Upload a File

#### PUT `/organizations/:organization_name/files/:filename`

Uploads a file to the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to upload.

**Example Request:**
```bash
curl  -X PUT \
  'https://upload.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --form 'mimeType="text/toml"' \
  --form 'file=@/home/shawn/code/SaladTechnologies/storage-service/wrangler.toml'
```

**Example Response:**
```json
{
  "url": "https://upload.salad.com/organizations/salad-benchmarking/files/wrangler.toml"
}
```

---

### Download a File

#### GET `/organizations/:organization_name/files/:filename`

Downloads a file from the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to download.


**Example Request:**
```bash
curl -X GET \
  'https://upload.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --output wrangler.toml
```

---

### Delete a File

#### DELETE `/organizations/:organization_name/files/:filename`

Deletes a file from the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to delete.

**Example Request:**
```bash
curl -X DELETE \
  'https://upload.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY'
```

---

### List Files

#### GET `/organizations/:organization_name/files`

Lists all files within the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.


**Example Request:**
```bash
curl -X GET \
  'https://upload.salad.com/organizations/salad-benchmarking/files' \
  --header 'Salad-Api-Key: YOURAPIKEY'
```

**Example Response:**
```json
{
  "files": [
    {
      "url": "https://upload.salad.com/organizations/salad-benchmarking/files/wrangler.toml",
      "size": 1024,
      "mimeType": "text/toml",
      "uploaded": "2021-09-01T12:00:00Z",
      "etag": "1234567890"
    }
  ]
}
```