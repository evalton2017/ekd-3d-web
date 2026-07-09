import { KeycloakConfig } from 'keycloak-js';

const keycloakConfig: KeycloakConfig = {
  url: 'https://auth-dev.agroprodes.com.br',
  realm: 'EKD-TEC',
  clientId: 'img-app'
};

export const environment = {
  versao: '1.0.0',
  production: true,
  appApiBase: 'https://dev.ekd-tec.com.br/api/v1',
  keycloakConfig,
  postLogoutRedirectUri: 'https://dev.ekd-tec.com.br',
  redirectUri: 'https://dev.ekd-tec.com.br/home',
  cleanUrl: 'https://dev.ekd-tec.com.br/silent-check-sso.html',
};
