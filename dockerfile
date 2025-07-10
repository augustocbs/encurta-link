# Dockerfile

# Use uma imagem base do Node.js
FROM node:20-alpine

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie os arquivos de dependência
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install

# Copie o restante do código-fonte da aplicação
COPY . .

# Exponha a porta que a aplicação usa
EXPOSE 3000

# O comando padrão (será sobrescrito pelo docker-compose em desenvolvimento)
CMD [ "npm", "run", "start:prod" ]