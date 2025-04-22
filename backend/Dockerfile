
FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev \
      librsvg2-dev libpng-dev libfreetype6-dev libfontconfig1-dev \
      fonts-dejavu fontconfig \
      tesseract-ocr tesseract-ocr-eng && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# 6) Copy the rest of the source (including index.cjs)
COPY . .

# 7) Ensure uploads folder exists
RUN mkdir -p uploads

# 8) Expose API port
EXPOSE 5000

# 9) Run your CommonJS entrypoint
CMD ["node", "index.cjs"]
