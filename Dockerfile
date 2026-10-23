FROM node:22-slim AS dev
# OpenSSL: Prisma's schema engine (`prisma migrate`). procps: `nest start --watch`
# kills the previous app with tree-kill, which needs `ps`; without it the old
# process survives and the restart fails with EADDRINUSE.
RUN apt-get update && apt-get install -y --no-install-recommends openssl procps && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@12.6.0
WORKDIR /app
RUN chown node:node /app
# Same UID (1000) as a typical host user, so files written to the bind mount
# (dist/, the generated Prisma client) aren't owned by root.
USER node
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
EXPOSE 3000
# The bind mount hides the client generated at install time, so generate it again.
CMD ["sh", "-c", "pnpm db:generate && pnpm start:dev"]
