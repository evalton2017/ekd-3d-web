import { KeycloakConfig } from 'keycloak-js';

const keycloakConfig: KeycloakConfig = {
  url: 'https://auth-dev.ekd-tec.com.br',
  realm: 'EKD-TEC',
  clientId: 'img-app'
};

export const environment = {
  versao: '1.0.0',
  production: false,
  appApiBase: 'http://localhost:9091/ekd-3d-api/v1',
  postLogoutRedirectUri: 'http://localhost:4200/app/',
  keycloakConfig,
  redirectUri:'http://localhost:4200/home/',
  cleanUrl: 'http://localhost:4200/silent-check-sso.html',
};
