import { bootstrapApplication } from '@angular/platform-browser';
import { createWithAppConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { ApplicationConfig } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import {registerLocaleData} from '@angular/common';

registerLocaleData(localePt);

// Gera a configuração base informando "true" para ativar os recursos do Navegador
const finalConfig = createWithAppConfig(true);

// Mescla os provedores do app.config com as máscaras globais
const serverConfig: ApplicationConfig = {
  providers: [
    ...(finalConfig.providers || []),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
};

// Inicializa a aplicação Angular 20 imediatamente de forma síncrona
bootstrapApplication(AppComponent, serverConfig)
  .catch((err) => console.error(err));
