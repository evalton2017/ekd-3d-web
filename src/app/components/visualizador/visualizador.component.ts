import { Component, ElementRef, Input, ViewChild, afterNextRender, inject, ChangeDetectorRef, signal } from '@angular/core';
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
export class Visualizador3dComponent {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

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
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    window.addEventListener('resize', () => this.onWindowResize());
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
        this.centralizarEAjustarModelo(mesh);
      }, undefined, (err) => this.tratarErro(err));
    }

    else if (extensao === '3mf') {
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
              child.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.4,
                metalness: 0.0,
                side: THREE.DoubleSide
              });
            }
            // Caso B: O arquivo possui múltiplos filamentos mapeados por cor (Vaso Amarelo/Coração Vermelho)
            else if (possuiMultiplasCores && child.material) {
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
              const corHex = (child.material as any).color ? (child.material as any).color.getHex() : 0xffffff;

              if (corHex === 0xffffff || corHex === 0xcccccc) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x3b82f6,
                  roughness: 0.4,
                  metalness: 0.2,
                  side: THREE.DoubleSide
                });
              } else {
                (child.material as any).side = THREE.DoubleSide;
              }
            }

            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.centralizarEAjustarModelo(group);
      }, undefined, (err) => this.tratarErro(err));
    } else {
      console.error('Extensão não mapeada para renderização WebGL.');
      this.carregando.set(false);
      this.cdr.markForCheck();
    }
  }

  private centralizarEAjustarModelo(objeto: THREE.Object3D): void {
    // CORREÇÃO DE EIXOS DA IMPRESSÃO 3D: Rotaciona X e Y para alinhar o modelo em pé voltado para a tela
    objeto.rotateX(-Math.PI / 2);
    objeto.rotateY(Math.PI / 2);

    this.currentMesh = objeto;
    this.scene.add(objeto);

    const box = new THREE.Box3().setFromObject(objeto);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Fixa o centro de massa do modelo no marco zero (0,0,0)
    objeto.position.x += (objeto.position.x - center.x);
    objeto.position.y += (objeto.position.y - center.y);
    objeto.position.z += (objeto.position.z - center.z);

    // Injeta a grade de fatiamento espacial rente à base inferior da peça
    const maxDim = Math.max(size.x, size.y, size.z);
    const gridHelper = new THREE.GridHelper(maxDim * 2, 20, 0x475569, 0x334155);
    gridHelper.position.y = box.min.y - center.y;
    this.scene.add(gridHelper);

    // Enquadramento dinâmico inteligente da câmera para evitar cortes horizontais
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.6;

    this.camera.position.set(maxDim, maxDim * 0.9, cameraZ);
    this.camera.lookAt(0, 0, 0);

    if (this.controls) {
      this.controls.target.set(0, 0, 0);
      this.controls.maxDistance = cameraZ * 3;
      this.controls.minDistance = maxDim * 0.4;
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
