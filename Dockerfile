FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN corepack enable
RUN pnpm install --no-frozen-lockfile --config.dangerously-allow-all-builds
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD [ "pnpm", "run", "start" ]