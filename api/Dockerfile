FROM node:22-alpine AS build

ARG NPM_TOKEN
WORKDIR /app
COPY .npmrc package*.json ./
RUN --mount=type=secret,id=npm_token \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/npm_token)" >> ~/.npmrc && \
    npm ci && \
    rm -rf ~/.npmrc
COPY . ./
# build & remove devDependencies from node_modules
RUN npm run build && npm prune --production

FROM node:22-alpine

ENV PORT=3000
WORKDIR /app

COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/envs /app/envs

EXPOSE 3000

HEALTHCHECK CMD curl --fail http://localhost:3000/health || exit 1

ENTRYPOINT [ "node" ]
CMD [ "--max-old-space-size=2048", "dist/main.js" ]
