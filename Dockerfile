FROM node:20.5.1-bookworm-slim
WORKDIR /app

COPY package*.json .
RUN yarn

COPY . .

RUN yarn build
RUN npx prisma generate

EXPOSE 5000

CMD [ "yarn", "start" ]