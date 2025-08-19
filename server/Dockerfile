FROM node:18-slim

# Install system dependencies and compilers
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    g++ \
    build-essential \
    openjdk-17-jdk \
    php \
    php-cli \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN java -version && \
    javac -version && \
    python3 --version && \
    g++ --version && \
    php --version && \
    node --version

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

RUN java -version && javac -version || echo "Java not found"

# Set execution limits for security
RUN echo "* soft nproc 50" >> /etc/security/limits.conf && \
    echo "* hard nproc 50" >> /etc/security/limits.conf && \
    echo "* soft nofile 1024" >> /etc/security/limits.conf && \
    echo "* hard nofile 1024" >> /etc/security/limits.conf

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application code
COPY . .

# Create temp directory for code execution
RUN mkdir -p /app/temp && \
    chmod 755 /app/temp

# Expose the application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["npm", "run", "dev"]