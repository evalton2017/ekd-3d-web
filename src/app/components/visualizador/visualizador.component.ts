import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  afterNextRender,
  inject,
  ChangeDetectorRef,
  signal,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-visualizador-3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-[450px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

      <!-- Tela de carregamento assíncrono -->
      @if (carregando()) {
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 backdrop-blur-sm">
          <svg class="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://w3.org" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-xs text-slate-400 font-medium">Carregando geometria e filamentos...</p>
        </div>
      }

      <!-- Container WebGL batiado pelo Three.js -->
      <div #rendererContainer class="w-full h-full cursor-grab active:cursor-grabbing"></div>

      <!-- Botão de Home para Resetar a Câmera -->
      <div class="absolute bottom-4 right-4 flex space-x-2 bg-slate-900/60 p-1.5 rounded-xl backdrop-blur-md border border-slate-700/50">
        <button (click)="resetarCamera()" title="Resetar Visualização" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center justify-center">
          <svg xmlns="http://w3.org" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class Visualizador3dComponent implements OnDestroy{
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  private animationFrameId: number | null = null;

  @Input() set urlArquivo(url: string | null) {
    if (url && this.sceneInitialized) {
      this.carregarModelo(url);
    }
    this._urlArquivo = url;
  }
  get urlArquivo(): string | null { return this._urlArquivo; }

  private _urlArquivo: string | null = null;
  private sceneInitialized = false;
  private cdr = inject(ChangeDetectorRef);

  carregando = signal<boolean>(false);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private currentMesh: THREE.Object3D | null = null;

  constructor() {
    // ESSENCIAL PARA SSR: Executa código gráfico exclusivamente no lado do navegador cliente
    afterNextRender(() => {
      this.inicializarCena3D();
      this.sceneInitialized = true;
      if (this._urlArquivo) {
        this.carregarModelo(this._urlArquivo);
      }
    });
  }

  private inicializarCena3D(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617); // Slate-950

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.set(0, 100, 150);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // MÁGICA VISUAL: Ativa o interpretador sRGB do WebGL para renderizar cores vivas do fatiador
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;

    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.2;

    // Configuração de Luz Dupla Anti-Sombras
    const lightAmbient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(lightAmbient);

    const lightTop = new THREE.DirectionalLight(0xffffff, 0.8);
    lightTop.position.set(1, 2, 3).normalize();
    this.scene.add(lightTop);

    const lightBottom = new THREE.DirectionalLight(0xffffff, 0.4);
    lightBottom.position.set(-1, -2, -3).normalize();
    this.scene.add(lightBottom);

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate()

    window.addEventListener('resize', () => this.onWindowResize());
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', () => this.onWindowResize());

    // Desaloca geometrias e materiais da cena atual
    if (this.scene) {
      this.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;

        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    // Destrói o renderer WebGL e limpa o elemento do DOM
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }

  private carregarModelo(url: string): void {
    this.carregando.set(true);
    this.cdr.markForCheck();

    // Remove o proxy do CDN para evitar quebras de handshake de CORS
    const urlCorrigidaSemCdn = url.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
    console.log('--- ENVIANDO PARA O MOTOR WEBGL ---', urlCorrigidaSemCdn);

    if (this.currentMesh) this.scene.remove(this.currentMesh);

    const extensao = urlCorrigidaSemCdn.split('.').pop()?.toLowerCase();

    if (extensao === 'stl') {
      const materialSTL = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.4,
        metalness: 0.2,
        side: THREE.DoubleSide
      });

      const loader = new STLLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(urlCorrigidaSemCdn, (geometry) => {
        const mesh = new THREE.Mesh(geometry, materialSTL);
        this.centralizarEAjustarModelo(mesh, extensao);
      }, undefined, (err) => this.tratarErro(err));
    }

    else if (extensao === '3mf') {
      console.log('IMAGEM 3MF')
      const loader = new ThreeMFLoader();
      loader.setCrossOrigin('anonymous');

      loader.load(urlCorrigidaSemCdn, (group) => {

        // Verifica se o arquivo traz múltiplos sub-objetos pintados por filamentos independentes
        let totalDeMalhas = 0;
        group.traverse((c) => { if (c instanceof THREE.Mesh) totalDeMalhas++; });
        const possuiMultiplasCores = totalDeMalhas > 1;

        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Caso A: O fatiador pintou o arquivo salvando cores diretamente por vértices/triângulos
            if (child.geometry && child.geometry.attributes['color']) {
              console.log('Caso A')
              const corOriginal = (child.material as any).color ? (child.material as any).color : new THREE.Color(0xffffff);

              child.material = new THREE.MeshStandardMaterial({
                color: corOriginal,
                roughness: 0.4,
                metalness: 0.1,
                side: THREE.DoubleSide
              });
            }
            // Caso B: O arquivo possui múltiplos filamentos mapeados por cor (Vaso Amarelo/Coração Vermelho)
            else if (possuiMultiplasCores && child.material) {
              console.log('Caso B')
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  (mat as any).side = THREE.DoubleSide;
                  if ('roughness' in mat) (mat as any).roughness = 0.5;
                  if ('metalness' in mat) (mat as any).metalness = 0.0;
                });
              } else {
                (child.material as any).side = THREE.DoubleSide;
                if ('roughness' in child.material) (child.material as any).roughness = 0.5;
                if ('metalness' in child.material) (child.material as any).metalness = 0.0;
              }
            }
            // Caso C: O modelo é inteiramente cinza/branco nativo sem cor. Força o azul corporativo da EKD
            else {
              console.log('Caso C')
              const mat = child.material as any;
              let corFinal = new THREE.Color(0xffffff);

              console.log(mat);
              if (mat && mat.color) {
                corFinal = mat.color;
              }
              if (mat.name === '___DEFAULT' || corFinal.getHex() === 0xffffff || corFinal.getHex() === 0xcccccc) {
                corFinal = new THREE.Color(0x334155);
              }

              child.material = new THREE.MeshStandardMaterial({
                color: corFinal,
                roughness: 0.6, // Deixa um aspecto levemente fosco como o PLA da foto
                metalness: 0.1,
                side: THREE.DoubleSide
              });

              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
        });

        this.centralizarEAjustarModelo(group, extensao);
      }, undefined, (err) => this.tratarErro(err));
    } else {
      console.error('Extensão não mapeada para renderização WebGL.');
      this.carregando.set(false);
      this.cdr.markForCheck();
    }
  }


  private centralizarEAjustarModelo(objeto: THREE.Object3D, extensao: 'stl' | '3mf'): void {
    // Limpa o modelo anterior da cena se houver
    if (this.currentMesh) this.scene.remove(this.currentMesh);

    // Ativa as sombras em todas as malhas internas
    objeto.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    let objetoFinalParaCena: THREE.Object3D;

    // ==========================================
    // TRATAMENTO DO STL
    // ==========================================
    if (extensao === 'stl' && objeto instanceof THREE.Mesh) {
      objeto.geometry.center(); // Centraliza o pivô interno do STL
      objeto.rotateX(-Math.PI / 2); // Coloca em pé
      objeto.updateMatrixWorld(true);

      objetoFinalParaCena = objeto;
    }

      // ==========================================
      // TRATAMENTO DO 3MF (Mágica do Pivô Centralizado)
    // ==========================================
    else {
      // 1. Cria um grupo invisível que servirá de "pivô de rotação" no centro da tela
      const pivotContainer = new THREE.Group();

      // 2. Calcula onde está o centro de massa real do modelo 3MF
      const box3mf = new THREE.Box3().setFromObject(objeto);
      const center3mf = box3mf.getCenter(new THREE.Vector3());

      // 3. Move o 3MF de forma inversa para dentro do container.
      // Isso faz com que o centro do modelo fique exatamente alinhado com o (0,0,0) do container.
      objeto.position.set(-center3mf.x, -center3mf.y, -center3mf.z);

      // 4. Coloca o 3MF dentro do container e rotaciona o CONTAINER (o que garante giro perfeito)
      pivotContainer.add(objeto);
      pivotContainer.rotateX(-Math.PI / 2); // Coloca em pé o bloco inteiro
      pivotContainer.updateMatrixWorld(true);

      objetoFinalParaCena = pivotContainer;
    }

    // Adiciona o modelo finalizado (ou o container) à cena
    this.currentMesh = objetoFinalParaCena;
    this.scene.add(objetoFinalParaCena);

    // ==========================================
    // ENQUADRAMENTO DA CÂMERA E CONTROLES
    // ==========================================
    const finalBox = new THREE.Box3().setFromObject(objetoFinalParaCena);
    const finalSize = finalBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(finalSize.x, finalSize.y, finalSize.z);

    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

    // Câmera posicionada de frente mirando o centro estável
    this.camera.position.set(0, maxDim * 0.3, cameraZ);
    this.camera.lookAt(0, 0, 0);

    if (this.controls) {
      this.controls.target.set(0, 0, 0); // Orbita estritamente o centro estável (0,0,0)
      this.controls.maxDistance = cameraZ * 3;
      this.controls.minDistance = maxDim * 0.2;
      this.controls.update();
    }

    this.carregando.set(false);
    this.cdr.markForCheck();
  }

  resetarCamera(): void {
    if (this.controls) this.controls.reset();
  }

  private onWindowResize(): void {
    if (!this.rendererContainer) return;
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private tratarErro(error: any): void {
    console.error('Falha crítica na decodificação geométrica:', error);
    this.carregando.set(false);
    this.cdr.markForCheck();
  }
}
