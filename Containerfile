# ---- build stage ----
FROM docker.io/library/node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- preview stage (default final target) ----
FROM docker.io/library/nginx:alpine AS preview
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
