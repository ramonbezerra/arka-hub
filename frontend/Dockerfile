# Development stage
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
EXPOSE 3000
CMD ["yarn", "start"]

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
# API URL baked at build time; override for production builds
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
# RUN yarn build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
