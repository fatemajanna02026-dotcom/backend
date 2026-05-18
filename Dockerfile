# ১. পাপেটিয়ারের অফিশিয়াল ইমেজ ব্যবহার করছি যাতে ক্রোম আর সব লাইব্রেরি আগে থেকেই থাকে
FROM ghcr.io/puppeteer/puppeteer:latest

# ২. রুট পারমিশন নিচ্ছি যাতে ফাইল সেভ করতে সমস্যা না হয়
USER root

WORKDIR /app

# ৩. প্যাকেজ ফাইল কপি করে ইন্সটল করছি
COPY package*.json ./
RUN npm install --production

# ৪. আপনার সব কোড কপি করছি
COPY . .

# ৫. হোয়াটসঅ্যাপ সেশন সেভ করার ফোল্ডার তৈরি ও পারমিশন দেওয়া
RUN mkdir -p .wwebjs_auth && chmod -R 777 .wwebjs_auth

# ৬. পোর্ট সেটআপ
ENV PORT=5000
EXPOSE 5000

# ৭. সার্ভার রান করার কমান্ড
CMD ["node", "server.js"]
