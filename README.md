# ArtistaConnect Front-end

Aplicação Angular standalone com Angular Router, Reactive Forms e HttpClient.
O front-end acessa os dados exclusivamente pela API .NET.

## Requisitos

- Node.js 22.22.3 ou superior na linha 22.
- npm 10 ou superior.
- API e MySQL em execução para validar persistência e autenticação.

## Executar

Configure uma vez os User Secrets da API na raiz `C:\workplace\Spotfy\ArtistaConnect`
(os valores ficam fora do repositório):

```powershell
Set-Location C:\workplace\Spotfy\ArtistaConnect
dotnet user-secrets set "ConnectionStrings:ArtistaConnect" "Server=localhost;Port=3306;Database=ArtistaConnect;Uid=root;Pwd=<SENHA_DO_MYSQL>;" --project .\ArtistaConnect.WebAPI
$jwtSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
dotnet user-secrets set "JWTSetting:SecretKey" $jwtSecret --project .\ArtistaConnect.WebAPI
dotnet watch --project .\ArtistaConnect.WebAPI --launch-profile http
```

O banco deve ser dedicado a este projeto. Na inicialização, o Entity Framework
aplica a migration aditiva: cria `Usuarios`, `Artistas` e `GenerosMusicais`,
preservando a tabela de músicas existente. Configure a connection string e a
chave JWT localmente; o MySQL precisa estar ativo e aceitar essas credenciais.

Em outro terminal:

```powershell
Set-Location C:\workplace\Spotfy\Front
npm install
npm start
```

Abra `http://localhost:4200`. O proxy em `proxy.conf.json` encaminha `/api`
para `http://localhost:5006`. Para outra porta, ajuste o proxy. Em produção,
publique o build de `dist/artistaconnect-angular/browser` e configure o host
para encaminhar `/api` ao back-end e servir o fallback da aplicação.

## Contratos disponíveis

- `POST /usuarios`: cria usuário com `Nome` e `Senha`; retorna somente ID e nome.
- `POST /login/auth`: recebe `Nome` e `Senha`; retorna o JWT em texto simples
  após validação do hash de senha.
- `GET`, `POST`, `PUT /{id}` e `DELETE /{id}` em `/artistas`: CRUD autenticado
  de artista com Nome, Bio e GeneroMusical, propriedades da entidade existente.
- `GET`, `POST`, `PUT /{id}` e `DELETE /{id}` em `/generos-musicais`: CRUD
  autenticado de gêneros com ID e Nome.
- `GET`, `POST`, `PUT` e `DELETE /musicas/`: operações autenticadas preservadas
  para Titulo, ArtistaResponsavel e Duracao.

As senhas são armazenadas com `PasswordHasher<Usuario>` (PBKDF2), nunca em
texto puro. A política atual exige pelo menos 12 caracteres. O token fica
apenas em memória no navegador e expira conforme as claims validadas pelo
servidor. Não há endpoint de revogação/renovação; logout limpa somente a
sessão local.

O modelo anterior não possuía tabela de usuários, gêneros nem relacionamento
relacional entre gêneros, artistas e músicas. A migration não tenta inferir
nem excluir dados antigos. O campo de gênero do artista continua texto para
preservar a entidade existente.

## Build e testes Angular

```powershell
npm run build
npm test -- --watch=false
```
