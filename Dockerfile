FROM ghcr.io/puppeteer/puppeteer:latest

# কাজের ডিরেক্টরি সেট করা
WORKDIR /app

# ফাইলগুলো কপি করা
COPY package*.json ./
RUN npm install

COPY . .

# পোর্টে পারমিশন দেওয়া
ENV PORT=5000
EXPOSE 5000

# সার্ভার স্টার্ট করা
CMD ["node", "server.js"]
