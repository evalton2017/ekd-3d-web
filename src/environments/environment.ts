import { KeycloakConfig } from 'keycloak-js';

const keycloakConfig: KeycloakConfig = {
  url: 'https://auth-dev.ekd-tec.com.br',
  realm: 'EKD-TEC',
  clientId: 'img-app'
};

export const environment = {
  versao: '1.0.0',
  production: true,
  appApiBase: 'https://dev.ekd-tec.com.br/ekd-3d-api/v1',
  keycloakConfig,
  postLogoutRedirectUri: 'https://dev.ekd-tec.com.br',
  redirectUri: 'https://dev.ekd-tec.com.br/ekd-3d-web',
  cleanUrl: 'https://dev.ekd-tec.com.br/ekd-3d-web/silent-check-sso.html',
};
