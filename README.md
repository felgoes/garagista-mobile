# Garagista Mobile

Aplicativo mobile do Garagista para controle de manutencao, abastecimentos, pecas e historico completo de veiculos.

## Visao geral

O Garagista e um app em React Native com Expo focado em organizar a rotina de carros, motos e outros veiculos em um so lugar.

Hoje o app permite:

- autenticacao de usuario
- cadastro e edicao de veiculos
- controle de manutencoes
- controle de pecas
- registro de abastecimentos
- calculo de consumo em km/L
- upload de foto do veiculo

## Stack

- Expo
- React Native
- React Navigation
- Axios
- AsyncStorage
- Expo Image Picker

## Requisitos

- Node.js 18+
- npm
- Expo CLI via `npx expo`
- backend da API rodando

## Instalacao

```bash
npm install
```

## Executando o projeto

```bash
npm start
```

Atalhos disponiveis:

```bash
npm run android
npm run ios
npm run web
```

## Configuracao da API

O app usa uma URL fixa da API em [src/services/api.js](./src/services/api.js):

```js
const API_URL = 'http://192.168.0.10:8000';
```

Antes de rodar no celular ou emulador, ajuste esse valor para o IP da maquina onde o backend `garagista-api` estiver executando.

Exemplos:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- dispositivo fisico: IP local da sua maquina na rede

## Estrutura

```text
src/
  components/
  context/
  hooks/
  navigation/
  screens/
  services/
  utils/
```

## Funcionalidades principais

### Veiculos

- cadastro de veiculos
- edicao de placa e km atual
- foto do veiculo com camera ou galeria

### Manutencoes

- registro de servicos executados
- custo, data, km e observacoes
- edicao e exclusao

### Abastecimentos

- registro de km rodado no tanque
- calculo de consumo em km/L
- destaque visual do consumo na listagem
- edicao e exclusao

### Pecas

- controle de pecas por slot
- historico de troca e previsao de proxima manutencao

## Observacoes

- o upload de foto depende da configuracao de storage no backend
- o app salva o token localmente via AsyncStorage
- em caso de `401`, o token e removido automaticamente

## Repositorio relacionado

Backend da API:

- `garagista-api`

## Nome do produto

Marca atual do app: `Garagista`
