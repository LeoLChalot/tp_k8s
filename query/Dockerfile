FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -y
COPY . .
EXPOSE 4002
CMD ["npm", "start"]