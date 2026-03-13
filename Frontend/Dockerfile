# Frontend Dockerfile - builds the Vite React app and serves it with nginx

FROM node:20-alpine AS build
WORKDIR /app

# Copy package metadata and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .

# Allow overriding the API URL at build time (e.g., via docker-compose build args).
# Vite embeds env vars during build, so this must be set at build time.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Serve with nginx
FROM nginx:stable-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
