FROM node:20
WORKDIR /src
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3003
CMD ["npm", "run", "start"]