import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Signals do Angular modernos para gerenciar os estados de abertura
  isDesktopExpanded = signal(true);
  isMobileOpen = signal(false);

  toggleDesktopMenu() {
    console.log('Toggle toggleDesktopMenu Menu');
    this.isDesktopExpanded.update(value => !value);
  }

  toggleMobileMenu() {
    console.log('Toggle Mobile Menu');
    this.isMobileOpen.update(value => !value);
  }

  closeMobileMenu() {
    console.log('Toggle closeMobileMenu Menu');
    this.isMobileOpen.set(false);
  }
}
