import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEncomendasComponent } from './admin-encomendas.component';

describe('AdminEncomendasComponent', () => {
  let component: AdminEncomendasComponent;
  let fixture: ComponentFixture<AdminEncomendasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEncomendasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEncomendasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
