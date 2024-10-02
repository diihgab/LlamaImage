# Usar uma imagem base do Node.js
FROM node:20

# Criar um diretório de trabalho dentro do container
WORKDIR /app

# Copiar o arquivo package.json e package-lock.json (se houver)
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar todos os arquivos da sua aplicação para o diretório de trabalho do container
COPY . .

# Expor a porta que o servidor vai rodar (3000 neste caso)
EXPOSE 3000

# Definir a variável de ambiente para o ambiente de produção (se aplicável)
ENV NODE_ENV=production

# Comando para rodar a aplicação
CMD ["node", "server.js"]
