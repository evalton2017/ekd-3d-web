import { Injectable, signal, inject, ApplicationRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  private appRef = inject(ApplicationRef);

  isDesktopExpanded = signal(true);
  isMobileOpen = signal(false);

  toggleDesktopMenu() {
    this.isDesktopExpanded.update(value => !value);
    this.appRef.tick();
  }

  toggleMobileMenu() {
    this.isMobileOpen.update(value => !value);
    this.appRef.tick();
  }

  closeMobileMenu() {
    this.isMobileOpen.set(false);
    this.appRef.tick();
  }
}
