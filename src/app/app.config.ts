import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideZonelessChangeDetection
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {routes} from './app.routes';
import {loadingInterceptor} from './interceptor/loading-interceptor';
import {environment} from '../environments/environment';
import {registerLocaleData} from '@angular/common';
import localePt from '@angular/common/locales/pt';

import Keycloak from 'keycloak-js';
import {
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor
} from 'keycloak-angular';

registerLocaleData(localePt);

const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http|https):\/\/.*$/i,
  bearerPrefix: 'Bearer'
});

export const createWithAppConfig = (isBrowser: boolean): ApplicationConfig => {

  const interceptors = [loadingInterceptor, includeBearerTokenInterceptor];

  if (isBrowser) {
    interceptors.push(includeBearerTokenInterceptor);
  }

  return {
    providers: [
      provideZonelessChangeDetection(),
      { provide: LOCALE_ID, useValue: 'pt-BR' },
      provideHttpClient(
        withFetch(),
        withInterceptors(interceptors)
      ),

      provideRouter(routes),
      provideClientHydration(withEventReplay()),

      {
        provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
        useValue: [urlCondition]
      },

      {
        provide: Keycloak,
        useFactory: () => {
          if (!isBrowser) {
            return {
              init: () => Promise.resolve(false),
              login: () => Promise.resolve(),
              logout: () => Promise.resolve(),
              authenticated: false,
              clearToken: () => {},
              updateToken: () => Promise.resolve(false)
            } as unknown as Keycloak;
          }

          return new Keycloak({
            url: environment.keycloakConfig.url,
            realm: environment.keycloakConfig.realm,
            clientId: environment.keycloakConfig.clientId
          });
        }
      },

      provideAppInitializer(() => {
        if (!isBrowser) return Promise.resolve();

        const keycloak = inject(Keycloak);

        // Tratamento correto do link do silent-check-sso
        let urlLimpa = environment.cleanUrl || '';
        if (urlLimpa.includes('/ekd-3d-web/')) {
          urlLimpa = '/ekd-3d-web/silent-check-sso.html';
        } else {
          urlLimpa = '/silent-check-sso.html';
        }

        const urlAbsolutaSso = window.location.origin + urlLimpa;
        console.log('[Keycloak Boot] Iniciando SSO silencioso com:', urlAbsolutaSso);

        // RETORNA DIRETAMENTE A PROMISE: O Keycloak vai ler o environment da Factory e iniciar
        return keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: urlAbsolutaSso,
          checkLoginIframe: false,
          messageReceiveTimeout: 5000,
          enableLogging: true,
          useNonce: false,
          pkceMethod: 'S256'
        })
          .then((authenticated) => {
            console.log(`[Cliente] Keycloak inicializado com sucesso. Autenticado: ${authenticated}`);
            return true;
          })
          .catch(error => {
            console.error('[Cliente] Falha crítica na inicialização do Keycloak:', error);
            return false;
          });
      })
    ]
  };
};
