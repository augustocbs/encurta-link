# Estágio de build
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos package.json e package-lock.json para instalar as dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia todo o código da aplicação para o diretório de trabalho
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build 

# Estágio de produção
FROM node:20-alpine AS production

WORKDIR /app

# Copia apenas os arquivos necessários do estágio de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copia o package.json para o comando start
COPY package.json ./package.json 

# Expõe a porta em que a aplicação irá rodar
EXPOSE 3000

# Inicia a aplicação compilada
CMD ["node", "dist/main"] 