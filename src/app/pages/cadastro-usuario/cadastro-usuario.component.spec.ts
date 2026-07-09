import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroUsuarioComponentTs } from './cadastro-usuario.component.ts';

describe('CadastroUsuarioComponentTs', () => {
  let component: CadastroUsuarioComponentTs;
  let fixture: ComponentFixture<CadastroUsuarioComponentTs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroUsuarioComponentTs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroUsuarioComponentTs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
