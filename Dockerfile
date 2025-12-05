# File: `Dockerfile.dev`
FROM node:20

WORKDIR /usr/src/app

# copy package files and install deps (dev included)
COPY package*.json ./
RUN npm ci

# copy app
COPY . .

# make entrypoint executable
COPY entrypoint.dev.sh /usr/local/bin/entrypoint.dev.sh
RUN chmod +x /usr/local/bin/entrypoint.dev.sh

ENV NODE_ENV=development
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.dev.sh"]
CMD ["npm", "run", "dev"]

# File: `entrypoint.dev.sh`
#!/usr/bin/env bash
#set -e
#
#: "${DB_HOST:=db}"
#: "${DB_PORT:=5432}"
#: "${DB_USER:=postgres}"
#: "${DB_PASS:=postgres}"
#: "${DB_NAME:=app_db}"
#
#echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
## portable tcp check using bash /dev/tcp
#until bash -c "cat < /dev/tcp/${DB_HOST}/${DB_PORT}" >/dev/null 2>&1; do
#  printf '.'
#  sleep 1
#done
#echo " Postgres is up."
#
## run migrations if requested
#if [ "${MIGRATE:-false}" = "true" ]; then
#  echo "Running migrations..."
#  # if you use sequelize-cli and have config that reads env vars, run like below
#  npx sequelize-cli db:migrate --url "postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}" || {
#    echo "Migrations failed"; exit 1;
#  }
#fi
#
#exec "$@"


