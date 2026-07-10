import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarPedidoComponent } from './solicitar-pedido.component';

describe('SolicitarPedidoComponent', () => {
  let component: SolicitarPedidoComponent;
  let fixture: ComponentFixture<SolicitarPedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarPedidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitarPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
