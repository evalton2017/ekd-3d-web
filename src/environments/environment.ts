import { KeycloakConfig } from 'keycloak-js';

const keycloakConfig: KeycloakConfig = {
  url: 'https://auth-dev.agroprodes.com.br',
  realm: 'EKD-TEC',
  clientId: 'img-app'
};

export const environment = {
  versao: '1.0.0',
  production: true,
  appApiBase: 'https://dev.agroprodes.com.br/agroprodes/api/v1',
  urlProc: 'https://dev.agroprodes.com.br/api/v1',
  keycloakConfig,
  postLogoutRedirectUri: 'https://dev.agroprodes.com.br/',
  redirectUri: 'https://dev.agroprodes.com.br/home',
  cleanUrl: 'https://dev.agroprodes.com.br/silent-check-sso.html',
};
