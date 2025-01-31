FROM node:20-slim
WORKDIR /app

COPY package*.json ./

RUN npm install
RUN apt-get update && apt-get install -y --no-install-recommends \
        g++ \
        python3 \
        redis-server && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . .
EXPOSE 8000 6379

CMD ["sh", "-c", "redis-server --daemonize yes && npm start"]
