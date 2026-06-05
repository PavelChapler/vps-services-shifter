FROM node:22-alpine
WORKDIR /app

# Зависимости (только express; node:sqlite встроен в Node 22)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Код приложения
COPY . .

ENV PORT=8787 DB_PATH=/data/data.db
EXPOSE 8787
CMD ["npm", "start"]
