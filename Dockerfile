FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json tsconfig.json vite.config.ts ./
COPY src-web ./src-web
COPY tests-web ./tests-web
RUN npm ci && npm run build

FROM rust:1.98-alpine AS service
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY Cargo.toml Cargo.lock build.rs ./
COPY src ./src
ARG BUILD_SHA=unknown
ENV BUILD_SHA=${BUILD_SHA}
RUN cargo build --release --locked

FROM alpine:3.22
RUN addgroup -S arena && adduser -S -G arena -u 10001 arena
WORKDIR /app
COPY --from=service /app/target/release/open-quiz-arena /usr/local/bin/open-quiz-arena
COPY --from=web /app/dist ./dist
ENV PORT=8080 STATIC_DIR=/app/dist RUST_LOG=info
EXPOSE 8080
USER 10001:10001
ENTRYPOINT ["/usr/local/bin/open-quiz-arena"]
