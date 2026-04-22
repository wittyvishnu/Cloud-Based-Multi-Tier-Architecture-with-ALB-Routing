FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install -g pm2

COPY . .

EXPOSE 4000

CMD ["pm2-runtime", "ecosystem.config.js"]