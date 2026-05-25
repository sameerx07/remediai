FROM node:20-alpine AS build

WORKDIR /workspace

# Docs build runs sync_docs_site.py before Docusaurus build.
RUN apk add --no-cache python3

COPY apps/docs/package*.json apps/docs/
WORKDIR /workspace/apps/docs
RUN npm ci

WORKDIR /workspace
COPY apps/docs/ apps/docs/
COPY scripts/sync_docs_site.py scripts/
COPY ARCHITECTURE.md TECH_STACK.md SECURITY_GUARDRAILS.md ROADMAP.md CONTRIBUTING.md ./
RUN npm --prefix apps/docs run build

FROM nginx:1.27-alpine AS production

# Copy build output to /remediai/ so Nginx serves it at the same path
# as GitHub Pages (baseUrl: '/remediai/'), keeping local and deployed URLs consistent.
COPY --from=build /workspace/apps/docs/build /usr/share/nginx/html/remediai
COPY apps/docs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
