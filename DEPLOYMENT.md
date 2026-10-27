Production uses `compose.coolify.yaml` and tested images in the S3-backed registry.
Deployments pull these images without rebuilding Next.js on the small VPS.
PostgreSQL and Meilisearch retain their named volumes.

The API repair removes a circular import between the auth barrel and users
controller. The regression check loads the same module graph that crashed in
production and verifies the public profile decorator metadata.

For a future release, change the two image tags in `compose.coolify.yaml`, then
build and publish on a host with sufficient memory:

```sh
docker compose -f compose.coolify.yaml -f compose.build.yaml build
docker compose -f compose.coolify.yaml -f compose.build.yaml push
```

The source Dockerfile runs the import regression check after compiling the API.
Verify `/healthz`, `/api/health`, `/api/stories`, and a 401 response from
`/api/auth/me` before treating an API deployment as ready. `/` redirects to `/api`.
