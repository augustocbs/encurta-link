# Encurtador de URL (Release 0.2.0 - Autenticação)

Este projeto é um serviço de encurtamento de URLs construído com NestJS, TypeScript e TypeORM, utilizando PostgreSQL como banco de dados. A aplicação é conteinerizada com Docker e Docker Compose.

## Funcionalidades da Release 0.2.0

*   **Autenticação de Usuários:**
    *   Registro de novos usuários com e-mail e senha.
    *   Login de usuários e geração de JSON Web Tokens (JWT).
    *   Proteção de rotas com JWT.
*   **Associação de URLs a Usuários:**
    *   URLs encurtadas podem ser associadas a um usuário autenticado.
    *   A funcionalidade de encurtamento de URL permanece disponível para usuários não autenticados (URLs anônimas).
*   **Gerenciamento de URLs:**
    *   Listar URLs do usuário autenticado.
    *   Atualizar URLs existentes.
    *   Exclusão lógica de URLs.
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
*   **Banco de Dados:** PostgreSQL
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
    Na raiz do projeto, crie um arquivo `.env` e preencha com suas credenciais do PostgreSQL, a URL base da aplicação e o **segredo JWT**:
    O projeto já possui um .env.example com informações padrão para ser utilizado.
    ```bash
    cp .env.example .env
    ```
    **Importante:**
    *   O `DB_HOST` deve ser `db` quando rodando com Docker Compose, pois `db` é o nome do serviço do PostgreSQL no `docker-compose.yml`.
    *   Certifique-se de adicionar a variável `JWT_SECRET` com uma string longa e aleatória.
    *   O `DB_PORT` padrão do PostgreSQL é 5432.

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

A API estará disponível em `http://localhost`.

*   **Documentação Swagger:** Acesse `http://localhost/api` para ver a documentação interativa da API.

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
    http://localhost/auth/register
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
    http://localhost/auth/login
    ```

*   **Obter Perfil do Usuário:**
    `GET /auth/profile`
    **Cabeçalhos da Requisição:**
    ```
    Authorization: Bearer SEU_TOKEN_AQUI
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X GET -H "Authorization: Bearer SEU_TOKEN_AQUI" \
    http://localhost/auth/profile
    ```

#### Endpoints de URLs

**Usando o Bearer Token**

Após o login, você receberá um `access_token`. Este token deve ser incluído no cabeçalho `Authorization` de requisições protegidas.

**Formato do Cabeçalho:** `Authorization: Bearer SEU_TOKEN_AQUI`

*   **Encurtar URL (com ou sem autenticação):**
    `POST /shorten`
    **Corpo da Requisição (JSON):**
    ```json
    {
    "originalUrl": "https://www.example.com/sua/longa/url/aqui"
    }
    ```
    **Exemplo com `curl` (com autenticação - URL será associada ao usuário):**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer SEU_TOKEN_AQUI" \
    -d '{"originalUrl": "https://www.google.com/authenticated"}' \
    http://localhost/shorten
    ```
    **Exemplo com `curl` (sem autenticação - URL anônima):**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
    -d '{"originalUrl": "https://www.google.com/anonymous"}' \
    http://localhost/shorten
    ```

*   **Redirecionar URL:**
    `GET /:shortCode`
    **Exemplo no navegador:**
    Se o `shorten` retornar `http://localhost/aBcDeF`, acesse `http://localhost/aBcDeF` no seu navegador.

*   **Listar URLs do Usuário (Requer Autenticação):**
    `GET /urls`
    **Cabeçalhos da Requisição:**
    ```
    Authorization: Bearer SEU_TOKEN_AQUI
    ```
    **Resposta de Sucesso:**
    ```json
    [
      {
        "originalUrl": "https://www.example.com",
        "shortCode": "aBcDeF",
        "clicks": 5
      },
      {
        "originalUrl": "https://www.google.com",
        "shortCode": "xYz123",
        "clicks": 12
      }
    ]
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X GET -H "Authorization: Bearer SEU_TOKEN_AQUI" \
    http://localhost/urls
    ```

*   **Atualizar URL (Requer Autenticação):**
    `PUT /urls/:id`
    **Parâmetros da URL:**
    - `id`: ID numérico da URL a ser atualizada
    **Corpo da Requisição (JSON):**
    ```json
    {
    "originalUrl": "https://www.nova-url.com"
    }
    ```
    **Cabeçalhos da Requisição:**
    ```
    Authorization: Bearer SEU_TOKEN_AQUI
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X PUT -H "Content-Type: application/json" \
    -H "Authorization: Bearer SEU_TOKEN_AQUI" \
    -d '{"originalUrl": "https://www.nova-url.com"}' \
    http://localhost/urls/123
    ```

*   **Excluir URL (Exclusão Lógica - Requer Autenticação):**
    `DELETE /urls/:id`
    **Parâmetros da URL:**
    - `id`: ID numérico da URL a ser excluída
    **Cabeçalhos da Requisição:**
    ```
    Authorization: Bearer SEU_TOKEN_AQUI
    ```
    **Resposta de Sucesso:** Status 204 (No Content)
    **Exemplo com `curl`:**
    ```bash
    curl -X DELETE -H "Authorization: Bearer SEU_TOKEN_AQUI" \
    http://localhost/urls/123
    ```

## Executando Testes

Para rodar os testes unitários:

```bash
docker compose exec app npm run test
```