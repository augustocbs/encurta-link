# Encurtador de URL (Release 0.1.0)

Este projeto é um serviço de encurtamento de URLs construído com NestJS, TypeScript e TypeORM, utilizando MySQL como banco de dados. A aplicação é conteinerizada com Docker e Docker Compose.

## Funcionalidades da Release 0.1.0

*   Encurtar URLs longas, gerando um código curto único.
*   Redirecionar usuários do código curto para a URL original.
*   Contabilização básica de cliques.
*   Validação de entrada para URLs.
*   Testes unitários para a lógica de negócio.
*   Documentação da API com Swagger (OpenAPI).
*   Logs estruturados para observabilidade básica.

## Tecnologias Utilizadas

*   **Backend:** Node.js, NestJS, TypeScript
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
    Na raiz do projeto, crie um arquivo `.env` e preencha com suas credenciais do MySQL e a URL base da aplicação:
    O projeto já possui um .env.example com informações padrão para ser utilizado.
    ```bash
    cp .env.example .env
    ```
    **Importante:** O `DB_HOST` deve ser `db` quando rodando com Docker Compose, pois `db` é o nome do serviço do MySQL no `docker-compose.yml`.

### Executando a Aplicação

1.  **Inicie os containers Docker:**
    Na raiz do projeto, execute:
    ```bash
    docker compose up --build -d
    ```
    Este comando irá construir a imagem da sua aplicação NestJS, iniciar o container do MySQL e o container da sua aplicação.

2.  **Verifique os logs (opcional):**
    Para ver se a aplicação iniciou corretamente e se o banco de dados foi sincronizado:
    ```bash
    docker compose logs app
    ```

### Usando a API

A API estará disponível em `http://localhost:3000`.

*   **Documentação Swagger:** Acesse `http://localhost:3000/api` para ver a documentação interativa da API.

*   **Encurtar URL:**
    `POST /shorten`
    **Corpo da Requisição (JSON):**
    ```json
    {
      "originalUrl": "https://www.example.com/sua/longa/url/aqui"
    }
    ```
    **Exemplo com `curl`:**
    ```bash
    curl -X POST -H "Content-Type: application/json" \
         -d '{"originalUrl": "https://www.google.com"}' \
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
```

Ou, se você tiver as dependências instaladas localmente (fora do container):

```bash
npm run test
```