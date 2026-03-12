FROM node:alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -y
COPY . .
RUN npm run build

FROM nginx:trixie
COPY --from=builder /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
EXPOSE 80