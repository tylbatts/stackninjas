# Use official Node.js LTS image
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Serve with Vite preview
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]