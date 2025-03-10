# Build stage
FROM node:20 AS builder
WORKDIR /src
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:20 AS runner
WORKDIR /src
COPY --from=builder /src/.next ./.next
COPY --from=builder /src/node_modules ./node_modules
COPY --from=builder /src/package.json ./package.json
COPY --from=builder /src/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]