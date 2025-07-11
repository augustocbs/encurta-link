# Encurtador de URL (Release 0.2.0 - Autenticação)

Este projeto é um serviço de encurtamento de URLs construído com NestJS, TypeScript e TypeORM, utilizando MySQL como banco de dados. A aplicação é conteinerizada com Docker e Docker Compose.

## Funcionalidades da Release 0.2.0

*   **Autenticação de Usuários:**
    *   Registro de novos usuários com e-mail e senha.
    *   Login de usuários e geração de JSON Web Tokens (JWT).
    *   Proteção de rotas com JWT.
*   **Associação de URLs a Usuários:**
    *   URLs encurtadas podem ser associadas a um usuário autenticado.
    *   A funcionalidade de encurtamento de URL permanece disponível para usuários não autenticados (URLs anônimas).
*   Encurtar URLs longas, gerando um código curto único.
*   Redirecionar usuários do código curto para a URL original.
*   Contabilização básica de cliques.
*   Validação de entrada para URLs.
*   Documentação da API com Swagger (OpenAPI).
*   Logs estruturados para observabilidade básica.

## Tecnologias Utilizadas

*   **Backend:** Node.js, NestJS, TypeScript
*   **Autenticação:** JWT, Bcrypt, Passport.js
*   **ORM:** TypeORM
*   **Banco de Dados:** MySQL
*   **Conteinerização:** Docker, Docker Compose
*   **Testes:** Jest
*   **Documentação API:** Swagger (OpenAPI)
*   **Logs:** Winston

## Como Rodar o Projeto

### Pré-requisitos

*   Docker Desktop (ou Docker Engine e Docker Compose) instalado.
*   Node.js (versão 20 ou superior, recomendado usar `nvm`).

### Configuração

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/augustocbs/encurta-link
    cd encurta-link
    ```

2.  **Crie o arquivo de variáveis de ambiente:**
    Na raiz do projeto, crie um arquivo `.env` e preencha com suas credenciais do MySQL, a URL base da aplicação e o **segredo JWT**:
    O projeto já possui um .env.example com informações padrão para ser utilizado.
    ```bash
    cp .env.example .env
    ```
    **Importante:**
    *   O `DB_HOST` deve ser `db` quando rodando com Docker Compose, pois `db` é o nome do serviço do MySQL no `docker-compose.yml`.
    *   Certifique-se de adicionar a variável `JWT_SECRET` com uma string longa e aleatória.

    Exemplo de `.env` em `.env.example`:

### Executando a Aplicação

1.  **Inicie os containers Docker:**
    Na raiz do projeto, execute:
    ```bash
    docker compose up --build -d
    ```
    Este comando irá construir a imagem da sua aplicação NestJS, iniciar o container do MySQL e o container da sua aplicação.

2.  **Execute as migrações do banco de dados:**
    Como `synchronize` está `false` em produção, você precisará rodar as migrações para criar as tabelas `users` e atualizar `urls`.
    ```bash
    docker compose exec app npm run migration:run
    ```
    **Nota:** Se você já rodou a aplicação com `synchronize: true` em desenvolvimento e depois mudou para `false`, a tabela `users` já pode existir. As migrações são importantes para garantir que o esquema esteja sempre atualizado.

3.  **Verifique os logs (opcional):**
    Para ver se a aplicação iniciou corretamente e se o banco de dados foi sincronizado:
    ```bash
    docker compose logs app
    ```

### Usando a API

A API estará disponível em `http://localhost:3000`.

*   **Documentação Swagger:** Acesse `http://localhost:3000/api` para ver a documentação interativa da API.

#### Endpoints de Autenticação

*   **Registrar Usuário:**
    `POST /auth/register`
    **Corpo da Requisição (JSON):**
    ```json
    {
      "email": "novo.usuario@example.com",
      "password": "SenhaSegura123"
    }
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -d '{"email": "teste@example.com", "password": "password123"}' \
         http://localhost:3000/auth/register
    ```

*   **Login de Usuário:**
    `POST /auth/login`
    **Corpo da Requisição (JSON):**
    ```json
    {
      "email": "novo.usuario@example.com",
      "password": "SenhaSegura123"
    }
    ```
    **Resposta de Sucesso:**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -d '{"email": "teste@example.com", "password": "password123"}' \
         http://localhost:3000/auth/login
    ```

#### Usando o Bearer Token

Após o login, você receberá um `access_token`. Este token deve ser incluído no cabeçalho `Authorization` de requisições protegidas (ou opcionais, como o `/shorten` para associar a URL ao usuário).

**Formato do Cabeçalho:** `Authorization: Bearer SEU_TOKEN_AQUI`

*   **Obter Perfil do Usuário (Exemplo de Rota Protegida):**
    `GET /auth/profile`
    **Cabeçalhos da Requisição:**
    ```
    Authorization: Bearer SEU_TOKEN_AQUI
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X GET -H "Authorization: Bearer SEU_TOKEN_AQUI" \
         http://localhost:3000/auth/profile
    ```

*   **Encurtar URL (com ou sem autenticação):**
    `POST /shorten`
    **Corpo da Requisição (JSON):**
    ```json
    {
      "originalUrl": "https://www.example.com/sua/longa/url/aqui"
    }
    ```
    **Exemplo com `curl` (com autenticação):**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -H "Authorization: Bearer SEU_TOKEN_AQUI" \
         -d '{"originalUrl": "https://www.google.com/authenticated"}' \
         http://localhost:3000/shorten
    ```
    **Exemplo com `curl` (sem autenticação - URL anônima):**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -d '{"originalUrl": "https://www.google.com/anonymous"}' \
         http://localhost:3000/shorten
    ```

*   **Redirecionar URL:**
    `GET /:shortCode`
    **Exemplo no navegador:**
    Se o `shorten` retornar `http://localhost:3000/aBcDeF`, acesse `http://localhost:3000/aBcDeF` no seu navegador.

## Executando Testes

Para rodar os testes unitários:

```bash
docker compose exec app npm run test