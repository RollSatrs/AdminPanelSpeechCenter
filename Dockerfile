FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN corepack enable
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD [ "pnpm", "run", "start" ]