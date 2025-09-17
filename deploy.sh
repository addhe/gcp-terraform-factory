#!/usr/bin/env bash
set -euo pipefail

# Improved deploy.sh
# - Builds the Docker image
# - Pushes to Artifact Registry
# - Ensures repo & secret exist (idempotent)
# - Deploys to Cloud Run and mounts API key from Secret Manager (recommended)
#
# Usage:
#   GCP_PROJECT=my-project ./deploy.sh [API_KEY]
# or set env before:
#   export API_KEY=xxx
#   GCP_PROJECT=my-project ./deploy.sh
#
# Optional env overrides:
#   REGION (default: us-central1)
#   SERVICE (default: gcp-terraform-iac-generator)
#   REPO (default: iac-generator-repo)
#   IMAGE_TAG (default: git short sha or 'local')
#   PLATFORM (docker build platform, default: linux/amd64)

PROJECT_ID=${GCP_PROJECT:-}
REGION=${REGION:-us-central1}
SERVICE=${SERVICE:-gcp-terraform-iac-generator}
REPO=${REPO:-iac-generator-repo}
IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo "local")}
PLATFORM=${PLATFORM:-linux/amd64}

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: GCP_PROJECT must be set in the environment. Example: GCP_PROJECT=my-project ./deploy.sh"
  exit 1
fi

API_KEY_FROM_ARG=${1:-${API_KEY:-}}
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${IMAGE_TAG}"

echo "[INFO] Project: ${PROJECT_ID}"
echo "[INFO] Region:  ${REGION}"
echo "[INFO] Service: ${SERVICE}"
echo "[INFO] Repo:     ${REPO}"
echo "[INFO] Image:    ${IMAGE_PATH}"
echo "[INFO] Platform: ${PLATFORM}"

echo "[STEP] Configuring gcloud project"
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "[STEP] Enabling required services (idempotent)"
gcloud services enable artifactregistry.googleapis.com run.googleapis.com >/dev/null

echo "[STEP] Ensuring Artifact Registry repo exists (idempotent)"
if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Images for ${SERVICE}" >/dev/null
fi

echo "[STEP] Configuring Docker auth for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" -q >/dev/null

echo "[STEP] Building image (platform: ${PLATFORM})"
docker build --platform="${PLATFORM}" -t "${IMAGE_PATH}" .

echo "[STEP] Pushing image"
docker push "${IMAGE_PATH}"

echo "[STEP] Preparing Secret Manager: api-key"
set +e
gcloud secrets describe api-key >/dev/null 2>&1
SECRET_EXISTS=$?
set -e
if [[ ${SECRET_EXISTS} -ne 0 ]]; then
  echo "[INFO] Secret api-key not found. Creating..."
  gcloud secrets create api-key --replication-policy="automatic"
fi

if [[ -n "${API_KEY_FROM_ARG}" ]]; then
  echo "[STEP] Adding new secret version from provided key"
  printf '%s' "${API_KEY_FROM_ARG}" | gcloud secrets versions add api-key --data-file=- >/dev/null
else
  echo "[INFO] No key provided via arg/env. Reusing latest secret version."
fi

echo "[STEP] Checking for enabled secret versions"
set +e
ENABLED_SECRET_VERSION=$(gcloud secrets versions list api-key \
  --filter="state=ENABLED" \
  --format="value(name)" \
  --limit=1 2>/dev/null)
set -e
if [[ -n "${ENABLED_SECRET_VERSION}" ]]; then
  echo "[INFO] Found enabled secret version: ${ENABLED_SECRET_VERSION}"
  USE_SECRET_FLAG=1
else
  echo "[WARN] No enabled secret versions found for api-key. Will deploy with empty API_KEY env var."
  USE_SECRET_FLAG=0
fi

echo "[STEP] Determining Cloud Run service account"
SA_EMAIL=$(gcloud run services describe "${SERVICE}" --region="${REGION}" --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)
if [[ -z "${SA_EMAIL}" ]]; then
  PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
  SA_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi
echo "[INFO] Using service account: ${SA_EMAIL}"

echo "[STEP] Granting Secret Manager access to service account (idempotent)"
gcloud secrets add-iam-policy-binding api-key \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null

echo "[STEP] Deploying to Cloud Run"
DEPLOY_ARGS=(
  "${SERVICE}"
  --image "${IMAGE_PATH}"
  --platform managed
  --region "${REGION}"
  --allow-unauthenticated
  --port=8080
  --timeout=300s
)

if [[ ${USE_SECRET_FLAG} -eq 1 ]]; then
  DEPLOY_ARGS+=(--set-secrets=API_KEY=api-key:latest)
else
  DEPLOY_ARGS+=(--set-env-vars=API_KEY=)
fi

gcloud run deploy "${DEPLOY_ARGS[@]}" || DEPLOY_FAILED=$?

if [[ -n "${DEPLOY_FAILED:-}" ]]; then
  echo "[WARN] Deploy command reported a failure (code=${DEPLOY_FAILED}). Collecting diagnostics..."
fi

echo "[DONE] Deployment initiated. Fetching recent logs (last 50 lines)"
# This requires gcloud beta; install if missing
if ! gcloud beta --help >/dev/null 2>&1; then
  echo "[INFO] Installing gcloud beta components"
  yes | gcloud components install beta >/dev/null || true
fi

gcloud beta run services logs read "${SERVICE}" --region="${REGION}" --limit=50 || true

echo "[INFO] Latest revisions:"
gcloud run revisions list --region="${REGION}" --service="${SERVICE}" --limit=5 || true

echo "[TIP] To update only the env var later without rebuilding:"
echo "  gcloud run services update ${SERVICE} --region=${REGION} --update-env-vars=API_KEY=NEW_KEY"
