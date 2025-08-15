# 🚀 Deployment Guide

Simple deployment guide for CodeFode in production environments.

## 🏗️ Architecture Overview

CodeFode consists of two main components:
- **Frontend**: Next.js application (client)
- **Backend**: Express.js server with Socket.IO (server)
- **Database**: MongoDB

## 🌐 Environment Setup

### Production Environment Variables

**Client (.env.production):**
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-api-domain.com
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

**Server (.env):**
```bash
NODE_ENV=production
PORT=8000
MONGO_URI=mongodb://your-mongodb-connection-string
COHERE_API_KEY=your-production-cohere-api-key
CLIENT_URL=https://your-frontend-domain.com
JWT_SECRET=your-production-jwt-secret
```

## 🐳 Docker Deployment

### 1. Build Docker Images

**Backend Dockerfile** (already exists):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

**Frontend Dockerfile** (create if needed):
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 2. Docker Compose Setup

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: codefode-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your-mongo-password
      MONGO_INITDB_DATABASE: codefode
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    ports:
      - "27017:27017"
    networks:
      - codefode-network

  backend:
    build: ./server
    container_name: codefode-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8000
      - MONGO_URI=mongodb://admin:your-mongo-password@mongodb:27017/codefode?authSource=admin
      - COHERE_API_KEY=${COHERE_API_KEY}
      - CLIENT_URL=https://your-frontend-domain.com
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
    networks:
      - codefode-network
    volumes:
      - ./server/logs:/app/logs

  frontend:
    build: ./client
    container_name: codefode-frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_BACKEND_URL=https://your-api-domain.com
      - NEXTAUTH_URL=https://your-frontend-domain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - codefode-network

  nginx:
    image: nginx:alpine
    container_name: codefode-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - codefode-network

volumes:
  mongodb_data:

networks:
  codefode-network:
    driver: bridge
```

### 3. Nginx Configuration

**nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:8000;
    }

    # Frontend server
    server {
        listen 80;
        server_name your-frontend-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-frontend-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Backend API server
    server {
        listen 80;
        server_name your-api-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-api-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support for Socket.IO
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. Deploy with Docker Compose

```bash
# Create environment file
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## ☁️ Cloud Platform Deployment

### Vercel (Frontend Only)

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "https://your-api-domain.com",
    "NEXTAUTH_URL": "https://your-frontend-domain.vercel.app",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

Deploy:
```bash
cd client
npx vercel --prod
```

### Railway (Backend)

**railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Render (Full Stack)

**render.yaml:**
```yaml
services:
  - type: web
    name: codefode-backend
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8000
      - key: MONGO_URI
        fromDatabase:
          name: codefode-db
          property: connectionString
      - key: COHERE_API_KEY
        sync: false

  - type: web
    name: codefode-frontend
    env: node
    buildCommand: cd client && npm install && npm run build
    startCommand: cd client && npm start
    envVars:
      - key: NEXT_PUBLIC_BACKEND_URL
        value: https://your-backend-service.onrender.com

databases:
  - name: codefode-db
    databaseName: codefode
    user: codefode
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Create database user and get connection string
4. Configure IP whitelist
5. Use connection string in `MONGO_URI`

**Example connection string:**
```
mongodb+srv://username:password@cluster.mongodb.net/codefode?retryWrites=true&w=majority
```

### Self-hosted MongoDB

**mongo-init.js** (for Docker setup):
```javascript
db.createUser({
  user: "codefode",
  pwd: "your-db-password",
  roles: [
    {
      role: "readWrite",
      db: "codefode"
    }
  ]
});
```

## 🔒 SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-frontend-domain.com -d your-api-domain.com

# Certificates will be in /etc/letsencrypt/live/
# Copy to your SSL directory for Docker/Nginx
```

### Using Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update DNS settings to point to your server
3. Enable "Flexible" or "Full" SSL in Cloudflare
4. Cloudflare handles SSL termination

## 📊 Monitoring & Logging

### Health Checks

Add health check endpoints for monitoring:

**Backend health check:**
```http
GET https://your-api-domain.com/health
```

**Frontend health check (add to Next.js):**
```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
```

### Log Management

**Docker logging:**
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Log rotation
docker run --log-opt max-size=10m --log-opt max-file=3 your-image
```

**Application logging:**
- Server logs are stored in `server/logs/`
- Use structured logging for better analysis
- Consider centralized logging (ELK stack, Grafana)

## 🔧 Performance Optimization

### Frontend Optimization

1. **Next.js optimizations:**
   ```javascript
   // next.config.js
   module.exports = {
     output: 'standalone',
     compress: true,
     generateEtags: false,
     poweredByHeader: false,
     experimental: {
       turbotrace: {
         logLevel: 'error'
       }
     }
   };
   ```

2. **Bundle analysis:**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

### Backend Optimization

1. **Enable compression:**
   ```javascript
   app.use(compression());
   ```

2. **Database indexing:**
   ```javascript
   // Add indexes for better performance
   db.workspaces.createIndex({ "roomId": 1 });
   db.workspaces.createIndex({ "lastUpdated": -1 });
   ```

3. **Caching:**
   ```javascript
   // Implement Redis for session storage and caching
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   ```

## 🔐 Security Considerations

### Environment Security
- Use strong, unique secrets for production
- Enable firewall on server (UFW on Ubuntu)
- Keep dependencies updated
- Use HTTPS everywhere
- Implement rate limiting

### Application Security
- Validate all inputs
- Sanitize user data
- Implement CSRF protection
- Use secure headers
- Monitor for security vulnerabilities

### Database Security
- Use database authentication
- Restrict IP access
- Enable database encryption
- Regular backups
- Monitor database access

## 🚨 Troubleshooting

### Common Issues

**Socket.IO connection failures:**
- Check CORS configuration
- Verify WebSocket support
- Check firewall settings
- Monitor network connectivity

**Database connection errors:**
- Verify connection string
- Check database server status
- Validate credentials
- Monitor connection pool

**Performance issues:**
- Monitor resource usage
- Check database query performance
- Review application logs
- Analyze network latency

### Debugging Production

```bash
# Check container status
docker ps
docker logs container-name

# Monitor resources
docker stats

# Database debugging
docker exec -it mongodb-container mongosh
```

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Socket.IO Production Guidelines](https://socket.io/docs/v4/production-checklist/)

## 📞 Support

For deployment issues:
1. Check the logs for error details
2. Review configuration files
3. Verify environment variables
4. Test individual components
5. Consult the troubleshooting section above