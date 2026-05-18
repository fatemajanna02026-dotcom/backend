# পাপেটিয়ারের অফিশিয়াল ইমেজ (এটি ১০০% কাজ করে)
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# ফাইল কপি ও ইন্সটল
COPY package*.json ./
RUN npm install --production

# সব কোড কপি
COPY . .

# পারমিশন ফিক্স
RUN mkdir -p .wwebjs_auth && chmod -R 777 .wwebjs_auth

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
