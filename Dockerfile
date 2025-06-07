FROM node:20-alpine
WORKDIR /app
COPY . .
CMD ["node", "index.js"]
EXPOSE 3000
