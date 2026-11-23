import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  ArtworkItem,
  MuseumData,
  MuseumRuntimeStats,
  WeddingStationType,
} from '../types/museum';
import { createDefaultWeddingConfig } from '../data/demoMuseums';
import {
  createCreamMarbleFloorTexture,
  createDarkParquetFloorTexture,
  createMuzeychaBrandWallTexture,
  createPlaqueTexture,
  createRedCarpetTexture,
  createWallPlasterTexture,
  createWhitePearlMarbleFloorTexture,
} from './museumTextures';
import {
  createBoyCharacter,
  createGirlCharacter,
  type VisitorCharacterRig,
  type VisitorGender,
} from './boyCharacterBuilder';
import {
  createCandleCluster,
  createCrystalChandelier,
  createFloralArrangement,
  createNeoclassicalWallPanels,
  createRomanArchwayWall,
  createWeddingCalendarTexture,
  createWeddingMannequin,
  createWeddingStations,
  type WeddingStationRef,
} from './weddingHallBuilder';
import type { AmbientMuseumAudio } from '../audio/ambientAudio';

interface PlacedArtwork {
  index: number;
  item: ArtworkItem;
  frameGroup: THREE.Group;
  hitMesh: THREE.Mesh;
  standPos: THREE.Vector3;
  lookPos: THREE.Vector3;
  videoEl?: HTMLVideoElement;
  texture?: THREE.Texture;
}

interface TourStop {
  standPos: THREE.Vector3;
  lookPos: THREE.Vector3;
  artworkIndex: number | null;
}

// Reusable math objects at module scope (zero GC in render loop)
const _moveVec = new THREE.Vector3();
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();

export interface MuseumEngineCallbacks {
  onStatsChange: (stats: MuseumRuntimeStats) => void;
  onSelectArtwork: (index: number) => void;
  onSelectStation: (station: WeddingStationType) => void;
}

export class MuseumEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private audio: AmbientMuseumAudio;
  private callbacks: MuseumEngineCallbacks;

  private museumGroup = new THREE.Group();
  private boyRig: VisitorCharacterRig;
  private girlRig: VisitorCharacterRig;
  private penguin: VisitorCharacterRig;
  private placedArtworks: PlacedArtwork[] = [];
  private hitMeshes: THREE.Mesh[] = [];
  private disposables: Array<{ dispose: () => void }> = [];
  private animatedFlames: THREE.Mesh[] = [];
  private weddingStations: WeddingStationRef[] = [];
  private dustPoints: THREE.Points | null = null;

  // Room collision bounds
  private bounds = { minX: -5, maxX: 5, minZ: -12, maxZ: 12 };

  // Tour & runtime state
  private tourStops: TourStop[] = [];
  private currentStopIdx = 0;
  private stopDwellTimer = 0;
  private isAutoTour = true;
  private viewedIndices = new Set<number>();
  private nearbyArtworkIdx: number | null = null;
  private nearbyStation: WeddingStationType | null = null;
  private initialWaveTimer = 0;

  // Controls state
  private joystick = { x: 0, y: 0 };
  private keys: Record<string, boolean> = {};
  private camYaw = 0;
  private camPitch = 0.24;
  private camDist = 3.9;
  private targetYaw = 0;
  private targetPitch = 0.24;
  private targetDist = 3.9;
  private isDragging = false;
  private pointerDownPos = { x: 0, y: 0 };
  private lastPointerPos = { x: 0, y: 0 };
  private hasMovedPointer = false;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();

  // Animation loop
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  constructor(
    container: HTMLElement,
    audio: AmbientMuseumAudio,
    callbacks: MuseumEngineCallbacks
  ) {
    this.container = container;
    this.audio = audio;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const initW = container.clientWidth || window.innerWidth;
    const initH = Math.max(1, container.clientHeight || window.innerHeight);
    const initAspect = initW / initH;
    this.camera = new THREE.PerspectiveCamera(
      this.getAdaptiveFov(initAspect),
      initAspect,
      0.1,
      90
    );

    // Mandatory studio environment reflection map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    this.scene.add(this.museumGroup);

    // Build both visitor characters once for instant boy/girl switching
    this.boyRig = createBoyCharacter();
    this.girlRig = createGirlCharacter();
    this.girlRig.root.visible = false;
    this.scene.add(this.boyRig.root);
    this.scene.add(this.girlRig.root);
    this.penguin = this.boyRig;

    this.bindEvents();
    this.startLoop();
  }

  private getAdaptiveFov(aspect: number): number {
    if (aspect < 0.85) {
      return THREE.MathUtils.clamp(54 + (0.85 - aspect) * 44, 54, 72);
    }
    return 54;
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
    dom.addEventListener('webglcontextlost', this.onContextLost);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = this.getAdaptiveFov(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    this.keys[e.code] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    this.isDragging = true;
    this.hasMovedPointer = false;
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };

    const totalDist = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y
    );
    if (totalDist > 6) {
      this.hasMovedPointer = true;
    }

    this.targetYaw -= dx * 0.0055;
    this.targetPitch = THREE.MathUtils.clamp(
      this.targetPitch + dy * 0.004,
      0.06,
      0.72
    );
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (!this.hasMovedPointer) {
      this.handleCanvasTap(e.clientX, e.clientY);
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.targetDist = THREE.MathUtils.clamp(
      this.targetDist + e.deltaY * 0.003,
      2.3,
      7.2
    );
  };

  private handleCanvasTap(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);
    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (typeof data.stationType === 'string') {
        this.callbacks.onSelectStation(data.stationType as WeddingStationType);
        return;
      }
      const idx = data.artworkIndex as number | undefined;
      if (typeof idx === 'number') {
        this.markViewed(idx);
        this.callbacks.onSelectArtwork(idx);
      }
    }
  }

  public setJoystick(x: number, y: number): void {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  public setAutoTour(enabled: boolean): void {
    this.isAutoTour = enabled;
    this.emitStats();
  }

  public setVisitorGender(gender: VisitorGender): void {
    const nextRig = gender === 'girl' ? this.girlRig : this.boyRig;
    if (this.penguin === nextRig) return;
    nextRig.root.position.copy(this.penguin.root.position);
    nextRig.root.rotation.copy(this.penguin.root.rotation);
    this.penguin.root.visible = false;
    this.penguin = nextRig;
    this.penguin.root.visible = true;
  }

  public jumpToArtwork(index: number): void {
    const placed = this.placedArtworks.find((a) => a.index === index);
    if (!placed) return;
    this.penguin.root.position.copy(placed.standPos);
    const angle = Math.atan2(
      placed.lookPos.x - placed.standPos.x,
      placed.lookPos.z - placed.standPos.z
    );
    this.penguin.root.rotation.y = angle;
    this.targetYaw = angle + Math.PI;
    this.camYaw = this.targetYaw;
    this.markViewed(index);
    const stopIdx = this.tourStops.findIndex((s) => s.artworkIndex === index);
    if (stopIdx >= 0) {
      this.currentStopIdx = stopIdx;
      this.stopDwellTimer = 2.4;
    }
    this.emitStats();
  }

  private markViewed(index: number): void {
    if (!this.viewedIndices.has(index)) {
      this.viewedIndices.add(index);
      this.audio.playDiscoverChime();
    }
  }

  private clearCurrentMuseum(): void {
    for (const art of this.placedArtworks) {
      if (art.videoEl) {
        art.videoEl.pause();
        art.videoEl.src = '';
      }
      if (art.texture) {
        art.texture.dispose();
      }
    }
    this.placedArtworks = [];
    this.hitMeshes = [];
    this.animatedFlames = [];
    this.weddingStations = [];
    this.dustPoints = null;
    this.tourStops = [];
    this.viewedIndices.clear();
    this.nearbyArtworkIdx = null;
    this.nearbyStation = null;

    this.museumGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        const renderable = obj as THREE.Mesh;
        renderable.geometry?.dispose();
        if (Array.isArray(renderable.material)) {
          renderable.material.forEach((m) => m.dispose());
        } else {
          renderable.material?.dispose();
        }
      }
    });

    while (this.museumGroup.children.length > 0) {
      this.museumGroup.remove(this.museumGroup.children[0]);
    }

    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  public loadMuseum(museum: MuseumData): void {
    this.clearCurrentMuseum();
    this.audio.setMood(museum.music);

    const resolvedGender: VisitorGender =
      museum.avatarGender === 'girl' || museum.weddingConfig?.mannequin === 'bride'
        ? 'girl'
        : 'boy';
    this.setVisitorGender(resolvedGender);

    if (museum.theme === 'wedding-invite') {
      this.buildWeddingInviteMuseum(museum);
    } else if (museum.theme === 'romantic-rose') {
      this.buildRomanticRoseMuseum(museum);
    } else {
      this.buildDarkGalleryMuseum(museum);
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.emitStats();
  }

  private loadArtworkTexture(
    item: ArtworkItem,
    targetMat: THREE.MeshStandardMaterial,
    artPlane: THREE.Mesh,
    maxW: number,
    maxH: number,
    maxAniso: number
  ): { videoEl?: HTMLVideoElement; texture?: THREE.Texture } {
    const fitPlaneToRatio = (w: number, h: number) => {
      if (!w || !h) return;
      const imgAspect = w / h;
      const boxAspect = maxW / maxH;
      if (imgAspect > boxAspect) {
        artPlane.scale.set(1, boxAspect / imgAspect, 1);
      } else {
        artPlane.scale.set(imgAspect / boxAspect, 1, 1);
      }
    };

    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.src;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.onloadedmetadata = () => fitPlaneToRatio(video.videoWidth, video.videoHeight);
      void video.play().catch(() => {});

      const vTex = new THREE.VideoTexture(video);
      vTex.colorSpace = THREE.SRGBColorSpace;
      vTex.minFilter = THREE.LinearFilter;
      vTex.magFilter = THREE.LinearFilter;
      targetMat.map = vTex;
      targetMat.needsUpdate = true;
      return { videoEl: video, texture: vTex };
    }

    const placeholder = document.createElement('canvas');
    placeholder.width = 2;
    placeholder.height = 2;
    const pCtx = placeholder.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = '#faf6f0';
      pCtx.fillRect(0, 0, 2, 2);
    }

    const tex: THREE.Texture = new THREE.Texture(placeholder);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.needsUpdate = true;
    targetMat.map = tex;
    targetMat.needsUpdate = true;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const applyLoadedImage = () => {
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      if (!nw || !nh) return;
      tex.image = img;
      tex.needsUpdate = true;
      fitPlaneToRatio(nw, nh);
    };
    img.onload = applyLoadedImage;
    img.onerror = () => {
      console.warn('Artwork image failed to load:', item.title);
    };
    img.src = item.src;
    if (img.complete && (img.naturalWidth || img.width) > 0) {
      applyLoadedImage();
    }

    return { texture: tex };
  }

  private createFramedArtwork(
    item: ArtworkItem,
    index: number,
    options: {
      frameColor: number;
      trimColor: number;
      matColor: number;
      plaqueBg: string;
      plaqueFg: string;
      width?: number;
      height?: number;
      addSpotlightCone?: boolean;
      spotLightHeight?: number;
    }
  ): THREE.Group {
    const w = options.width ?? 1.85;
    const h = options.height ?? 2.3;
    const frameDepth = 0.1;
    const border = 0.14;
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    const group = new THREE.Group();

    // Outer frame body
    const frameMat = new THREE.MeshStandardMaterial({
      color: options.frameColor,
      roughness: 0.35,
      metalness: 0.45,
    });
    const outerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + border * 2, h + border * 2, frameDepth),
      frameMat
    );
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    group.add(outerMesh);

    // Inner gold/brass museum bevel trim
    const trimMat = new THREE.MeshStandardMaterial({
      color: options.trimColor,
      roughness: 0.28,
      metalness: 0.82,
    });
    const trimMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.08, h + 0.08, frameDepth + 0.015),
      trimMat
    );
    trimMesh.position.z = 0.005;
    group.add(trimMesh);

    // Inner passe-partout mat
    const matBoard = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, frameDepth + 0.022),
      new THREE.MeshStandardMaterial({ color: options.matColor, roughness: 0.85 })
    );
    matBoard.position.z = 0.008;
    group.add(matBoard);

    // Artwork archival matte surface (prevents washed-out glare in luminous halls)
    const artMat = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.94,
      metalness: 0.0,
      envMapIntensity: 0.05,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0,
    });
    const artW = w - 0.22;
    const artH = h - 0.22;
    const artPlane = new THREE.Mesh(new THREE.PlaneGeometry(artW, artH), artMat);
    artPlane.position.z = frameDepth / 2 + 0.024;
    artPlane.userData.artworkIndex = index;
    group.add(artPlane);

    // Load texture with automatic natural aspect-ratio fitting
    const { videoEl, texture } = this.loadArtworkTexture(
      item,
      artMat,
      artPlane,
      artW,
      artH,
      maxAniso
    );

    // Bottom museum plaque
    const plaqueTex = createPlaqueTexture(item.title || `Xotira #${index + 1}`, {
      bg: options.plaqueBg,
      fg: options.plaqueFg,
      border: '#b8945a',
    });
    this.disposables.push(plaqueTex);
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.24, 0.03),
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.45 })
    );
    plaque.position.set(0, -(h / 2 + border + 0.24), 0.01);
    group.add(plaque);

    // Optional warm spotlight + subtle light cone (iconic look from 00:01)
    if (options.addSpotlightCone) {
      const spotY = options.spotLightHeight ?? 2.35;
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.18, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
      );
      fixture.position.set(0, spotY, 1.15);
      fixture.rotation.x = Math.PI * 0.28;
      group.add(fixture);

      const spot = new THREE.SpotLight(0xffd7a3, 18, 8.5, Math.PI * 0.23, 0.65, 1.6);
      spot.position.set(0, spotY, 1.25);
      spot.target.position.set(0, 0.05, 0.1);
      group.add(spot);
      group.add(spot.target);

      // Soft translucent volumetric cone
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xffd39c,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const coneGeo = new THREE.ConeGeometry(1.35, 3.2, 24, 1, true);
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(0, 1.0, 0.75);
      cone.rotation.x = -0.34;
      group.add(cone);
    }

    this.hitMeshes.push(artPlane);

    const standPos = new THREE.Vector3();
    const lookPos = new THREE.Vector3();
    this.placedArtworks.push({
      index,
      item,
      frameGroup: group,
      hitMesh: artPlane,
      standPos,
      lookPos,
      videoEl,
      texture,
    });

    return group;
  }

  /**
   * THEME 1: Dark Gallery (Exact 1:1 recreation of 00:01-00:02 in the video)
   */
  private buildDarkGalleryMuseum(museum: MuseumData): void {
    const artworks = museum.artworks;
    const count = Math.max(artworks.length, 1);
    const sideCount = Math.max(Math.ceil((count - 1) / 2), 3);
    const spacing = 4.5;
    const roomLength = Math.max(20, sideCount * spacing + 6);
    const roomWidth = 11.4;
    const roomHeight = 5.4;

    this.scene.background = new THREE.Color(0x0b0806);
    this.scene.fog = new THREE.FogExp2(0x0b0806, 0.022);

    this.bounds = {
      minX: -roomWidth / 2 + 1.15,
      maxX: roomWidth / 2 - 1.15,
      minZ: -roomLength / 2 + 1.4,
      maxZ: roomLength / 2 - 1.4,
    };

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // Warm/cool balanced gallery lighting
    const hemi = new THREE.HemisphereLight(0xffe6cc, 0x1a1412, 0.42);
    this.museumGroup.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffdfb8, 0.65);
    keyLight.position.set(2, 8, 6);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.museumGroup.add(keyLight);

    // Floor: dark parquet with subtle warm reflection
    const floorTex = createDarkParquetFloorTexture(maxAniso);
    this.disposables.push(floorTex);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomLength),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.34,
        metalness: 0.12,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.museumGroup.add(floor);

    // Walls & Ceiling
    const wallTex = createWallPlasterTexture('#17120e', maxAniso);
    this.disposables.push(wallTex);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.86,
      metalness: 0.04,
    });

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    backWall.position.set(0, roomHeight / 2, -roomLength / 2);
    backWall.receiveShadow = true;

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    frontWall.position.set(0, roomHeight / 2, roomLength / 2);
    frontWall.rotation.y = Math.PI;

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomLength),
      new THREE.MeshStandardMaterial({ color: 0x0e0a08, roughness: 0.9 })
    );
    ceiling.position.set(0, roomHeight, 0);
    ceiling.rotation.x = Math.PI / 2;

    this.museumGroup.add(leftWall, rightWall, backWall, frontWall, ceiling);

    // Baseboard trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 0.5 });
    for (const side of [-1, 1]) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, roomLength), trimMat);
      base.position.set(side * (roomWidth / 2 - 0.04), 0.11, 0);
      this.museumGroup.add(base);
    }

    // Center gallery velvet benches
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x261d19, roughness: 0.75 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x8e6f41, roughness: 0.3, metalness: 0.8 });
    for (const bz of [-4.5, 4.5]) {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 2.4), benchMat);
      seat.position.y = 0.46;
      seat.castShadow = true;
      bench.add(seat);
      for (const lx of [-0.4, 0.4]) {
        for (const lz of [-0.95, 0.95]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.44, 10), legMat);
          leg.position.set(lx, 0.22, lz);
          bench.add(leg);
        }
      }
      bench.position.set(0, 0, bz);
      this.museumGroup.add(bench);
    }

    // Place artworks along left wall, right wall, and end wall
    const startZ = roomLength / 2 - 4.4;
    const endWallIndex = artworks.length > 2 ? artworks.length - 1 : -1;

    artworks.forEach((item, i) => {
      if (i === endWallIndex) {
        const frame = this.createFramedArtwork(item, i, {
          frameColor: 0x161210,
          trimColor: 0xc8a25a,
          matColor: 0xf4eee6,
          plaqueBg: '#1b1512',
          plaqueFg: '#f5e6d3',
          width: 2.35,
          height: 2.85,
          addSpotlightCone: true,
          spotLightHeight: 2.25,
        });
        frame.position.set(0, 2.35, -roomLength / 2 + 0.12);
        this.museumGroup.add(frame);

        const placed = this.placedArtworks[this.placedArtworks.length - 1];
        placed.standPos.set(0, 0, -roomLength / 2 + 3.2);
        placed.lookPos.set(0, 2.1, -roomLength / 2);
      } else {
        const isLeft = i % 2 === 0;
        const row = Math.floor(i / 2);
        const z = startZ - row * spacing;
        const xWall = isLeft ? -roomWidth / 2 + 0.12 : roomWidth / 2 - 0.12;

        const frame = this.createFramedArtwork(item, i, {
          frameColor: 0x15110f,
          trimColor: 0xb99352,
          matColor: 0xf5efe6,
          plaqueBg: '#1b1512',
          plaqueFg: '#f5e6d3',
          width: 1.9,
          height: 2.35,
          addSpotlightCone: true,
        });
        frame.position.set(xWall, 2.15, z);
        frame.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        this.museumGroup.add(frame);

        const placed = this.placedArtworks[this.placedArtworks.length - 1];
        placed.standPos.set(isLeft ? -roomWidth / 2 + 2.8 : roomWidth / 2 - 2.8, 0, z);
        placed.lookPos.set(xWall, 2.0, z);
      }
    });

    // Subtle golden floating dust motes
    this.addFloatingParticles(0xffd7a8, roomWidth - 1, roomHeight - 0.6, roomLength - 1, 140);

    // Build tour stops & initial pose (matching 00:01 viewing frame on left wall!)
    this.tourStops = this.placedArtworks.map((p) => ({
      standPos: p.standPos.clone(),
      lookPos: p.lookPos.clone(),
      artworkIndex: p.index,
    }));

    if (this.tourStops.length > 0) {
      const startStop = this.tourStops[Math.min(1, this.tourStops.length - 1)];
      this.penguin.root.position.copy(startStop.standPos);
      const initYaw = Math.atan2(
        startStop.lookPos.x - startStop.standPos.x,
        startStop.lookPos.z - startStop.standPos.z
      );
      this.penguin.root.rotation.y = initYaw;
      this.camYaw = initYaw + Math.PI - 0.18;
      this.targetYaw = this.camYaw;
      this.currentStopIdx = Math.min(2, this.tourStops.length - 1);
      this.stopDwellTimer = 1.6;
      this.initialWaveTimer = 0;
      this.isAutoTour = true;

      // Pre-mark initial viewed artwork for authentic museum feel
      this.viewedIndices.add(0);
    }
  }

  /**
   * THEME 2: Romantic Rose / Marry Me (Exact 1:1 recreation of 00:15-00:17 in the video)
   */
  private buildRomanticRoseMuseum(museum: MuseumData): void {
    const artworks = museum.artworks;
    const count = Math.max(artworks.length, 1);
    const sideCount = Math.max(Math.ceil((count - 1) / 2), 3);
    const spacing = 4.4;
    const roomLength = Math.max(24, sideCount * spacing + 8);
    const roomWidth = 12.6;
    const roomHeight = 5.6;

    this.scene.background = new THREE.Color(0xdcc2aa);
    this.scene.fog = new THREE.FogExp2(0xdcc2aa, 0.015);

    this.bounds = {
      minX: -roomWidth / 2 + 1.2,
      maxX: roomWidth / 2 - 1.2,
      minZ: -roomLength / 2 + 2.2,
      maxZ: roomLength / 2 - 1.5,
    };

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // Warm daylight + candlelight ambience
    const hemi = new THREE.HemisphereLight(0xfff1e0, 0xb88b6d, 1.05);
    this.museumGroup.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe6cc, 1.15);
    keyLight.position.set(2, 9, 8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.museumGroup.add(keyLight);

    // Cream marble floor
    const floorTex = createCreamMarbleFloorTexture(maxAniso);
    this.disposables.push(floorTex);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomLength),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.25,
        metalness: 0.08,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.museumGroup.add(floor);

    // Red velvet carpet runner down the center (offset +0.02 on Y to prevent Z-fighting)
    const carpetTex = createRedCarpetTexture(maxAniso);
    this.disposables.push(carpetTex);
    const carpetLen = roomLength - 3.6;
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.75, carpetLen),
      new THREE.MeshStandardMaterial({
        map: carpetTex,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.022, 0.2);
    carpet.receiveShadow = true;
    this.museumGroup.add(carpet);

    // Warm cream walls & ceiling
    const wallTex = createWallPlasterTexture('#e6ceb8', maxAniso);
    this.disposables.push(wallTex);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.82,
      metalness: 0.02,
    });

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    backWall.position.set(0, roomHeight / 2, -roomLength / 2);
    backWall.receiveShadow = true;

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    frontWall.position.set(0, roomHeight / 2, roomLength / 2);
    frontWall.rotation.y = Math.PI;

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomLength),
      new THREE.MeshStandardMaterial({ color: 0xe3cbb5, roughness: 0.85 })
    );
    ceiling.position.set(0, roomHeight, 0);
    ceiling.rotation.x = Math.PI / 2;

    this.museumGroup.add(leftWall, rightWall, backWall, frontWall, ceiling);

    // Recessed warm glowing ceiling lights (like 00:16)
    const ceilingLightMat = new THREE.MeshStandardMaterial({
      color: 0xfff8ed,
      emissive: 0xffdfad,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    for (let z = -roomLength / 2 + 3; z <= roomLength / 2 - 3; z += 3.8) {
      for (const lx of [-3.6, 0, 3.6]) {
        const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 14), ceilingLightMat);
        puck.position.set(lx, roomHeight - 0.02, z);
        this.museumGroup.add(puck);
      }
    }

    // Scattered red rose petals along carpet & marble (InstancedMesh)
    const petalCount = 240;
    const petalGeo = new THREE.CircleGeometry(0.065, 7);
    petalGeo.scale(1.25, 0.85, 1);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xc9182b,
      roughness: 0.72,
      side: THREE.DoubleSide,
    });
    const petalsInst = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    const cTemp = new THREE.Color();
    for (let i = 0; i < petalCount; i++) {
      const px = (Math.random() - 0.5) * 4.4;
      const pz = (Math.random() - 0.5) * (roomLength - 4);
      _dummyObj.position.set(px, 0.032 + (i % 3) * 0.002, pz);
      _dummyObj.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
      const sc = 0.75 + Math.random() * 0.65;
      _dummyObj.scale.set(sc, sc, sc);
      _dummyObj.updateMatrix();
      petalsInst.setMatrixAt(i, _dummyObj.matrix);
      cTemp.setHSL(0.97 + (Math.random() - 0.5) * 0.03, 0.82, 0.36 + Math.random() * 0.16);
      petalsInst.setColorAt(i, cTemp);
    }
    petalsInst.computeBoundingSphere();
    this.museumGroup.add(petalsInst);

    // Glass cylinder candles lining both sides of the red carpet
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff8ee,
      roughness: 0.08,
      metalness: 0.0,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.34 : 0.45,
      transmission: this.isSoftwareGl ? 0 : 0.75,
      depthWrite: false,
    });
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xfff3de, roughness: 0.65 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });

    for (let z = -roomLength / 2 + 4.0; z <= roomLength / 2 - 4.0; z += 3.2) {
      for (const side of [-1, 1]) {
        const cx = side * 1.68;
        const candleGroup = new THREE.Group();
        candleGroup.position.set(cx, 0, z);

        const h = 0.36 + ((Math.abs(z) * 13) % 3) * 0.09;
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, h + 0.14, 16, 1, true),
          glassMat
        );
        glass.position.y = (h + 0.14) / 2;
        candleGroup.add(glass);

        const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, h, 14), waxMat);
        wax.position.y = h / 2;
        candleGroup.add(wax);

        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), flameMat);
        flame.scale.set(0.75, 1.65, 0.75);
        flame.position.y = h + 0.05;
        candleGroup.add(flame);
        this.animatedFlames.push(flame);

        this.museumGroup.add(candleGroup);
      }

      // Add a warm point light every other pair for soft candle glow without hurting FPS
      if (Math.round(z) % 2 === 0) {
        const pLight = new THREE.PointLight(0xffb86c, 2.2, 6.5, 1.8);
        pLight.position.set(0, 0.8, z);
        this.museumGroup.add(pLight);
      }
    }

    // White pedestals with rose bouquets along outer aisle
    const pedMat = new THREE.MeshStandardMaterial({ color: 0xf7f2ec, roughness: 0.4 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a3b, roughness: 0.7 });
    const roseMat = new THREE.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.55 });
    const whiteRoseMat = new THREE.MeshStandardMaterial({ color: 0xfff0f3, roughness: 0.55 });

    for (let z = -roomLength / 2 + 5.2; z <= roomLength / 2 - 6.0; z += 5.4) {
      for (const side of [-1, 1]) {
        const ped = new THREE.Group();
        ped.position.set(side * 2.55, 0, z);

        const col = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.05, 0.54), pedMat);
        col.position.y = 0.525;
        col.castShadow = true;
        col.receiveShadow = true;
        ped.add(col);

        const vase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.1, 0.34, 14),
          new THREE.MeshStandardMaterial({ color: 0xfaf7f2, roughness: 0.2 })
        );
        vase.position.y = 1.22;
        ped.add(vase);

        const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), leafMat);
        foliage.position.y = 1.48;
        ped.add(foliage);

        for (let r = 0; r < 6; r++) {
          const ang = (r / 6) * Math.PI * 2;
          const rose = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.085, 0),
            r % 3 === 0 ? whiteRoseMat : roseMat
          );
          rose.position.set(
            Math.cos(ang) * 0.16,
            1.52 + (r % 2) * 0.08,
            Math.sin(ang) * 0.16
          );
          ped.add(rose);
        }
        this.museumGroup.add(ped);
      }
    }

    // Grand "MARRY ME" Rose Arch at the focal back wall (matching 00:17!)
    const archZ = -roomLength / 2 + 1.15;
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, archZ);

    // Structural arch frame behind roses
    const archFrameMat = new THREE.MeshStandardMaterial({ color: 0x3b1f22, roughness: 0.7 });
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.9, 0.35), archFrameMat);
    leftPost.position.set(-1.95, 1.95, 0);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.9, 0.35), archFrameMat);
    rightPost.position.set(1.95, 1.95, 0);
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.52, 0.35), archFrameMat);
    topBeam.position.set(0, 3.85, 0);
    archGroup.add(leftPost, rightPost, topBeam);

    // Dense InstancedMesh roses covering the arch (red & cream roses + green leaves)
    const archRoseGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const archRoseMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
    const archSpots: Array<[number, number, number]> = [];
    for (let y = 0.25; y <= 3.7; y += 0.26) {
      archSpots.push([-1.95, y, 0.18], [1.95, y, 0.18]);
    }
    for (let x = -1.85; x <= 1.85; x += 0.26) {
      archSpots.push([x, 3.82, 0.18], [x, 3.56, 0.16]);
    }
    const archRoses = new THREE.InstancedMesh(archRoseGeo, archRoseMat, archSpots.length);
    archSpots.forEach(([rx, ry, rz], idx) => {
      _dummyObj.position.set(
        rx + (Math.random() - 0.5) * 0.18,
        ry + (Math.random() - 0.5) * 0.16,
        rz + Math.random() * 0.14
      );
      _dummyObj.rotation.set(Math.random() * 2, Math.random() * 2, 0);
      const sc = 0.85 + Math.random() * 0.55;
      _dummyObj.scale.set(sc, sc, sc);
      _dummyObj.updateMatrix();
      archRoses.setMatrixAt(idx, _dummyObj.matrix);
      if (idx % 4 === 0) {
        cTemp.setHex(0xfceef0); // ivory white rose accent
      } else if (idx % 5 === 0) {
        cTemp.setHex(0x2d5a3b); // deep foliage accent
      } else {
        cTemp.setHSL(0.97, 0.82, 0.3 + Math.random() * 0.14);
      }
      archRoses.setColorAt(idx, cTemp);
    });
    archRoses.computeBoundingSphere();
    archGroup.add(archRoses);

    // "Bizning muzeyimiz" plaque above the arch (matching 00:17)
    const topPlaqueTex = createPlaqueTexture(museum.title || 'Bizning muzeyimiz', {
      bg: '#f8efe5',
      fg: '#3c2922',
      border: '#c8a25a',
      font: '600 42px "Cormorant Garamond", Georgia, serif',
    });
    this.disposables.push(topPlaqueTex);
    const topPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.5, 0.08),
      new THREE.MeshStandardMaterial({ map: topPlaqueTex, roughness: 0.4 })
    );
    topPlaque.position.set(0, 4.35, 0.22);
    archGroup.add(topPlaque);

    // "MARRY ME" banner plaque inside lower arch (matching 00:17)
    const heroLabel = museum.heroText?.trim() || 'MARRY ME';
    const marryTex = createPlaqueTexture(heroLabel, {
      bg: '#f2e3d3',
      fg: '#5a2026',
      border: '#d4af37',
      font: '700 48px "Cormorant Garamond", Georgia, serif',
    });
    this.disposables.push(marryTex);
    const marrySign = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.52, 0.08),
      new THREE.MeshStandardMaterial({ map: marryTex, roughness: 0.35 })
    );
    marrySign.position.set(0, 0.88, 0.16);
    archGroup.add(marrySign);

    this.museumGroup.add(archGroup);

    // Muzeycha.uz brand logo emblem near the entrance wall (like 00:15)
    const brandTex = createMuzeychaBrandWallTexture();
    this.disposables.push(brandTex);
    const brandSign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.6),
      new THREE.MeshBasicMaterial({ map: brandTex, transparent: true })
    );
    brandSign.position.set(0, 3.65, roomLength / 2 - 4.5);
    this.museumGroup.add(brandSign);

    // Place artworks: last/hero artwork goes inside the Rose Arch, others line both cream walls
    const startZ = roomLength / 2 - 4.8;
    const heroIndex = artworks.length > 0 ? artworks.length - 1 : -1;

    artworks.forEach((item, i) => {
      if (i === heroIndex) {
        const frame = this.createFramedArtwork(item, i, {
          frameColor: 0x3b231d,
          trimColor: 0xd4af37,
          matColor: 0xfff8f0,
          plaqueBg: '#f6eadc',
          plaqueFg: '#422820',
          width: 1.7,
          height: 2.05,
        });
        frame.position.set(0, 2.35, archZ + 0.1);
        this.museumGroup.add(frame);

        const placed = this.placedArtworks[this.placedArtworks.length - 1];
        placed.standPos.set(0, 0, archZ + 3.2);
        placed.lookPos.set(0, 2.2, archZ);
      } else {
        const isLeft = i % 2 === 0;
        const row = Math.floor(i / 2);
        const z = startZ - row * spacing;
        const xWall = isLeft ? -roomWidth / 2 + 0.12 : roomWidth / 2 - 0.12;

        const frame = this.createFramedArtwork(item, i, {
          frameColor: 0x5c4033,
          trimColor: 0xd4af37,
          matColor: 0xfff9f2,
          plaqueBg: '#f6eadc',
          plaqueFg: '#422820',
          width: 1.8,
          height: 2.2,
        });
        frame.position.set(xWall, 2.2, z);
        frame.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        this.museumGroup.add(frame);

        const placed = this.placedArtworks[this.placedArtworks.length - 1];
        placed.standPos.set(isLeft ? -roomWidth / 2 + 3.1 : roomWidth / 2 - 3.1, 0, z);
        placed.lookPos.set(xWall, 2.1, z);
      }
    });

    this.addFloatingParticles(0xfff0d6, roomWidth - 1, roomHeight - 0.8, roomLength - 1, 90);

    // Tour stops: start at the entrance facing down the red carpet (00:15 wave, then walk toward MARRY ME!)
    this.tourStops = [
      ...this.placedArtworks.slice(0, Math.max(0, this.placedArtworks.length - 1)).map((p) => ({
        standPos: p.standPos.clone(),
        lookPos: p.lookPos.clone(),
        artworkIndex: p.index,
      })),
      ...(this.placedArtworks.length > 0
        ? [
            {
              standPos: this.placedArtworks[this.placedArtworks.length - 1].standPos.clone(),
              lookPos: this.placedArtworks[this.placedArtworks.length - 1].lookPos.clone(),
              artworkIndex: this.placedArtworks[this.placedArtworks.length - 1].index,
            },
          ]
        : []),
    ];

    this.penguin.root.position.set(0, 0, roomLength / 2 - 2.6);
    // Briefly face camera (+Z) and wave, then turn and walk down the red carpet!
    this.penguin.root.rotation.y = 0;
    this.camYaw = 0;
    this.targetYaw = 0;
    this.currentStopIdx = 0;
    this.stopDwellTimer = 0.2;
    this.initialWaveTimer = 1.8;
    this.isAutoTour = true;
  }

  /**
   * THEME 3: To'yga Taklifnoma (Exact 1:1 recreation of Video 2 — Two-room Neoclassical White Wedding Hall)
   */
  private buildWeddingInviteMuseum(museum: MuseumData): void {
    const artworks = museum.artworks;
    const cfg = museum.weddingConfig ?? createDefaultWeddingConfig();

    // 12 wall slots: 6 in Room 1 side walls + 2 on archway wings + 4 in Room 2 side walls
    const room1Capacity = artworks.length <= 12 ? Math.min(6, artworks.length) : artworks.length - 4;
    const room1ArtCount = Math.max(4, room1Capacity);
    const pairCount = Math.max(2, Math.ceil(room1ArtCount / 2));
    const photoSpacing = 4.2;
    const room1Len = Math.max(13.6, pairCount * photoSpacing + 3.4);
    const room2Len = 12.8;
    const roomWidth = 12.6;
    const totalLength = room1Len + room2Len;
    const centerZ = (room1Len - room2Len) / 2;
    const room2BackZ = -room2Len;
    const room1FrontZ = room1Len;
    const roomHeight = 6.0;

    this.scene.background = new THREE.Color(0xf2ede6);
    this.scene.fog = new THREE.FogExp2(0xf2ede6, 0.0045);

    this.bounds = {
      minX: -roomWidth / 2 + 1.15,
      maxX: roomWidth / 2 - 1.15,
      minZ: room2BackZ + 1.75,
      maxZ: room1FrontZ - 1.5,
    };

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // Balanced neoclassical wedding lighting (warm/cool contrast, keeps photos crisp & vivid)
    const hemi = new THREE.HemisphereLight(0xfffdf9, 0xe8dfd3, 1.04);
    this.museumGroup.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff6e9, 0.78);
    keyLight.position.set(3, 10, 8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 18;
    keyLight.shadow.camera.bottom = -18;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.museumGroup.add(keyLight);

    // Pearl-white glossy marble floor
    const floorTex = createWhitePearlMarbleFloorTexture(maxAniso);
    this.disposables.push(floorTex);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, totalLength),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.16,
        metalness: 0.06,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = centerZ;
    floor.receiveShadow = true;
    this.museumGroup.add(floor);

    // Warm ivory neoclassical plaster walls & ceiling (subtle warm off-white for crisp depth)
    const wallTex = createWallPlasterTexture('#f4efe8', maxAniso);
    this.disposables.push(wallTex);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.78,
      metalness: 0.01,
    });

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(totalLength, roomHeight), wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, centerZ);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(totalLength, roomHeight), wallMat);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, centerZ);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    backWall.position.set(0, roomHeight / 2, room2BackZ);
    backWall.receiveShadow = true;

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    frontWall.position.set(0, roomHeight / 2, room1FrontZ);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, totalLength),
      new THREE.MeshStandardMaterial({ color: 0xfbf9f6, roughness: 0.85 })
    );
    ceiling.position.set(0, roomHeight, centerZ);
    ceiling.rotation.x = Math.PI / 2;
    this.museumGroup.add(leftWall, rightWall, backWall, frontWall, ceiling);

    // Raised neoclassical wall panels, chair rails, pilasters & crown molding
    const wallPanels = createNeoclassicalWallPanels(totalLength, roomHeight, roomWidth, centerZ);
    wallPanels.position.z = centerZ;
    this.museumGroup.add(wallPanels);

    // True curved Roman Archway wall at z = 0 connecting Room 1 & Room 2
    const archwayWall = createRomanArchwayWall(
      roomWidth,
      roomHeight,
      museum.title || "To'yga Taklifnoma",
      this.disposables
    );
    archwayWall.position.set(0, 0, 0);
    this.museumGroup.add(archwayWall);

    // Grand 5-tier Golden Crystal Chandeliers (Room 1 & Room 2)
    const ch1 = createCrystalChandelier();
    ch1.position.set(0, roomHeight, room1Len * 0.5);
    const ch2 = createCrystalChandelier();
    ch2.position.set(0, roomHeight, room2BackZ * 0.5);
    this.museumGroup.add(ch1, ch2);

    // Natural multi-height pillar candles inside hurricane glass on brass trays lining the aisle
    for (let cz = 1.8; cz <= room1FrontZ - 2.8; cz += 3.2) {
      for (const side of [-1, 1]) {
        const cluster = createCandleCluster(this.isSoftwareGl, this.animatedFlames);
        cluster.position.set(side * 1.6, 0, cz);
        cluster.rotation.y = side * 0.6 + cz * 0.3;
        this.museumGroup.add(cluster);
      }
    }

    // Natural layered rose floral urns on neoclassical pedestals
    const firstPhotoZ = room1FrontZ - 2.9;
    const floralSpots: Array<[number, number]> = [
      [-2.75, 0.85],
      [2.75, 0.85],
      [-4.9, room1FrontZ - 0.95],
      [4.9, room1FrontZ - 0.95],
      [-5.1, room2BackZ + 1.4],
      [5.1, room2BackZ + 1.4],
    ];
    for (let row = 0; row < pairCount - 1; row++) {
      const fz = firstPhotoZ - photoSpacing * 0.5 - row * photoSpacing;
      floralSpots.push([-5.25, fz], [5.25, fz]);
    }
    for (const [fx, fz] of floralSpots) {
      const urn = createFloralArrangement(true);
      urn.position.set(fx, 0, fz);
      urn.rotation.y = (fx + fz) * 0.4;
      this.museumGroup.add(urn);
    }

    // Helper to safely pick an artwork slot and place a framed photo/video
    const frameThemeOpts = {
      frameColor: 0xddd0bf,
      trimColor: 0xd4af37,
      matColor: 0xffffff,
      plaqueBg: '#faf6f0',
      plaqueFg: '#3d2c24',
    };

    const placeFrame = (
      itemIdx: number,
      itemOverride: ArtworkItem | null,
      pos: [number, number, number],
      rotY: number,
      standPos: [number, number, number],
      lookPos: [number, number, number],
      width: number,
      height: number
    ) => {
      if (artworks.length === 0 && !itemOverride) return;
      const resolvedIdx = artworks.length > 0 ? itemIdx % artworks.length : 0;
      const item = itemOverride ?? artworks[resolvedIdx];
      const frame = this.createFramedArtwork(item, resolvedIdx, {
        ...frameThemeOpts,
        width,
        height,
      });
      frame.position.set(pos[0], pos[1], pos[2]);
      frame.rotation.y = rotY;
      this.museumGroup.add(frame);

      const placed = this.placedArtworks[this.placedArtworks.length - 1];
      placed.standPos.set(standPos[0], standPos[1], standPos[2]);
      placed.lookPos.set(lookPos[0], lookPos[1], lookPos[2]);
    };

    // 1) Room 1 Left & Right Side Walls
    const sideItems = artworks.slice(0, room1ArtCount);
    sideItems.forEach((item, i) => {
      const isLeft = i % 2 === 0;
      const row = Math.floor(i / 2);
      const z = firstPhotoZ - row * photoSpacing;
      const xWall = isLeft ? -roomWidth / 2 + 0.12 : roomWidth / 2 - 0.12;
      placeFrame(
        i,
        item,
        [xWall, 2.45, z],
        isLeft ? Math.PI / 2 : -Math.PI / 2,
        [isLeft ? -roomWidth / 2 + 3.0 : roomWidth / 2 - 3.0, 0, z],
        [xWall, 2.25, z],
        2.05,
        2.55
      );
    });

    // 2) BACK ENTRANCE WALL (z = room1FrontZ): Monumental Hero Portrait + Welcoming Groom/Bride beside gallery!
    const heroArtwork: ArtworkItem | null = cfg.heroPortraitSrc
      ? {
          id: 'hero-portrait',
          title: museum.title || 'Baxtli Portret',
          caption: 'Asosiy zal portreti',
          type: 'image',
          src: cfg.heroPortraitSrc,
        }
      : artworks[0] ?? null;

    placeFrame(
      0,
      heroArtwork,
      [0, 2.75, room1FrontZ - 0.14],
      Math.PI,
      [0, 0, room1FrontZ - 3.2],
      [0, 2.55, room1FrontZ - 0.14],
      3.15,
      3.75
    );

    // Groom or Bride welcoming host standing gracefully beside the photo gallery / Hero Portrait wall
    const galleryHost = createWeddingMannequin(cfg.mannequin);
    galleryHost.position.set(-2.65, 0, room1FrontZ - 1.55);
    galleryHost.rotation.y = Math.PI * 0.85;
    this.museumGroup.add(galleryHost);

    // 3) STRAIGHT-AHEAD ARCHWAY WINGS (z = 0.27, left & right of Roman Archway facing Room 1)
    const wingOffset = room1ArtCount;
    placeFrame(
      wingOffset,
      null,
      [-4.25, 2.48, 0.28],
      0,
      [-4.25, 0, 2.9],
      [-4.25, 2.35, 0.28],
      1.9,
      2.45
    );
    placeFrame(
      wingOffset + 1,
      null,
      [4.25, 2.48, 0.28],
      0,
      [4.25, 0, 2.9],
      [4.25, 2.35, 0.28],
      1.9,
      2.45
    );

    // 4) ROOM 2 SIDE WALLS (4 framed photo/video slots filling empty side walls of Room 2)
    const r2SideSlots: Array<{ x: number; z: number; isLeft: boolean; offset: number }> = [
      { x: -roomWidth / 2 + 0.12, z: -3.6, isLeft: true, offset: wingOffset + 2 },
      { x: roomWidth / 2 - 0.12, z: -3.6, isLeft: false, offset: wingOffset + 3 },
      { x: -roomWidth / 2 + 0.12, z: -8.6, isLeft: true, offset: wingOffset + 4 },
      { x: roomWidth / 2 - 0.12, z: -8.6, isLeft: false, offset: wingOffset + 5 },
    ];
    for (const s of r2SideSlots) {
      placeFrame(
        s.offset,
        null,
        [s.x, 2.45, s.z],
        s.isLeft ? Math.PI / 2 : -Math.PI / 2,
        [s.isLeft ? -roomWidth / 2 + 2.8 : roomWidth / 2 - 2.8, 0, s.z],
        [s.x, 2.3, s.z],
        2.0,
        2.5
      );
    }

    // 5) ROOM 2 BACK WALL ("to'g'ridagi devor"): Wedding Calendar flanked by 2 Grand Vertical Portraits!
    const calTex = createWeddingCalendarTexture(cfg.weddingDate);
    this.disposables.push(calTex);
    const calFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.7, 3.7, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xefe5d6, roughness: 0.45 })
    );
    calFrame.position.set(0, 2.85, room2BackZ + 0.12);
    const calFace = new THREE.Mesh(
      new THREE.PlaneGeometry(3.45, 3.45),
      new THREE.MeshBasicMaterial({ map: calTex })
    );
    calFace.position.set(0, 2.85, room2BackZ + 0.18);
    this.museumGroup.add(calFrame, calFace);

    // Left & Right Grand Portraits flanking the Calendar on the straight-ahead back wall
    placeFrame(
      0,
      heroArtwork,
      [-3.85, 2.8, room2BackZ + 0.14],
      0,
      [-3.5, 0, room2BackZ + 3.2],
      [-3.85, 2.6, room2BackZ + 0.14],
      2.15,
      3.05
    );
    placeFrame(
      Math.min(1, Math.max(0, artworks.length - 1)),
      null,
      [3.85, 2.8, room2BackZ + 0.14],
      0,
      [3.5, 0, room2BackZ + 3.2],
      [3.85, 2.6, room2BackZ + 0.14],
      2.15,
      3.05
    );

    // Room 2 Center Podium: Groom or Bride Mannequin (natural tailored figure)
    const mannequin = createWeddingMannequin(cfg.mannequin);
    mannequin.position.set(0, 0, room2BackZ + 2.55);
    this.museumGroup.add(mannequin);

    // Room 2 Three Interactive Stations (Concierge Location Map, Tilaklar Kitobi, To'yona Bankomati)
    const { group: stationsGroup, stations } = createWeddingStations(
      cfg,
      this.disposables,
      room2BackZ
    );
    this.museumGroup.add(stationsGroup);
    this.weddingStations = stations;
    for (const s of stations) {
      for (const hm of s.hitMeshes) {
        this.hitMeshes.push(hm);
      }
    }

    // Tour stops: browse unique artworks in Room 1 -> Archway -> Room 2 Calendar & Portraits
    const seenIdx = new Set<number>();
    const uniqueStops: TourStop[] = [];
    for (const p of this.placedArtworks) {
      if (!seenIdx.has(p.index)) {
        seenIdx.add(p.index);
        uniqueStops.push({
          standPos: p.standPos.clone(),
          lookPos: p.lookPos.clone(),
          artworkIndex: p.index,
        });
      }
    }
    this.tourStops = [
      ...uniqueStops,
      {
        standPos: new THREE.Vector3(0, 0, -6.2),
        lookPos: new THREE.Vector3(0, 2.5, room2BackZ),
        artworkIndex: null,
      },
    ];

    this.penguin.root.position.set(0, 0, room1FrontZ - 2.35);
    this.penguin.root.rotation.y = Math.PI;
    this.camYaw = 0;
    this.targetYaw = 0;
    this.currentStopIdx = 0;
    this.stopDwellTimer = 1.6;
    this.initialWaveTimer = 0;
    this.isAutoTour = false;
  }

  private addFloatingParticles(
    color: number,
    spreadX: number,
    spreadY: number,
    spreadZ: number,
    count: number
  ): void {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spreadX;
      positions[i * 3 + 1] = 0.4 + Math.random() * spreadY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dustPoints = new THREE.Points(geo, mat);
    this.museumGroup.add(this.dustPoints);
  }

  private emitStats(): void {
    const nearbyItem =
      this.nearbyArtworkIdx !== null
        ? this.placedArtworks.find((a) => a.index === this.nearbyArtworkIdx)?.item ?? null
        : null;

    this.callbacks.onStatsChange({
      viewedCount: this.viewedIndices.size,
      totalCount: this.placedArtworks.length,
      activeArtworkIndex: this.nearbyArtworkIdx,
      nearbyArtwork: nearbyItem,
      nearbyStation: this.nearbyStation,
      isAutoTour: this.isAutoTour,
    });
  }

  private updateMovementAndTour(dt: number): number {
    let moveSpeed = 0;

    // Gather manual input (joystick + keyboard)
    let inputX = this.joystick.x;
    let inputY = this.joystick.y;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    const inputMag = Math.hypot(inputX, inputY);

    if (inputMag > 0.08) {
      this.initialWaveTimer = 0;
      const clampedMag = Math.min(inputMag, 1);
      const nx = inputX / inputMag;
      const ny = inputY / inputMag;

      // Camera-relative movement on XZ plane
      _forwardVec.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      _rightVec.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));

      _moveVec
        .set(0, 0, 0)
        .addScaledVector(_forwardVec, -ny)
        .addScaledVector(_rightVec, nx)
        .normalize();

      const walkRate = 3.2 * clampedMag;
      this.penguin.root.position.addScaledVector(_moveVec, walkRate * dt);
      moveSpeed = walkRate;

      // Smoothly face movement direction
      const desiredAngle = Math.atan2(_moveVec.x, _moveVec.z);
      let diff = desiredAngle - this.penguin.root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.penguin.root.rotation.y += diff * Math.min(1, dt * 10);

      this.audio.playFootstep();
    } else if (this.isAutoTour && this.tourStops.length > 0) {
      if (this.initialWaveTimer > 0) {
        this.initialWaveTimer = Math.max(0, this.initialWaveTimer - dt);
        // Smoothly turn camera behind penguin as wave finishes
        if (this.initialWaveTimer < 0.4) {
          this.targetYaw = THREE.MathUtils.damp(this.targetYaw, 0, 3, dt);
        }
      } else {
        const stop = this.tourStops[this.currentStopIdx];
        _moveVec.subVectors(stop.standPos, this.penguin.root.position);
        _moveVec.y = 0;
        const dist = _moveVec.length();

        if (dist > 0.25) {
          _moveVec.normalize();
          const autoSpeed = 1.95;
          this.penguin.root.position.addScaledVector(_moveVec, autoSpeed * dt);
          moveSpeed = autoSpeed;

          const desiredAngle = Math.atan2(_moveVec.x, _moveVec.z);
          let diff = desiredAngle - this.penguin.root.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.penguin.root.rotation.y += diff * Math.min(1, dt * 6);

          // Gently guide camera behind penguin when user isn't dragging
          if (!this.isDragging) {
            const behindYaw = desiredAngle + Math.PI;
            let yawDiff = behindYaw - this.targetYaw;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            this.targetYaw += yawDiff * Math.min(1, dt * 1.4);
          }
          this.audio.playFootstep();
        } else {
          // Arrived at artwork stop: turn to admire frame, then dwell
          const lookAngle = Math.atan2(
            stop.lookPos.x - this.penguin.root.position.x,
            stop.lookPos.z - this.penguin.root.position.z
          );
          let diff = lookAngle - this.penguin.root.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.penguin.root.rotation.y += diff * Math.min(1, dt * 5);

          this.stopDwellTimer -= dt;
          if (this.stopDwellTimer <= 0) {
            this.currentStopIdx = (this.currentStopIdx + 1) % this.tourStops.length;
            this.stopDwellTimer = 2.8;
          }
        }
      }
    }

    // Clamp penguin inside museum room bounds
    this.penguin.root.position.x = THREE.MathUtils.clamp(
      this.penguin.root.position.x,
      this.bounds.minX,
      this.bounds.maxX
    );
    this.penguin.root.position.z = THREE.MathUtils.clamp(
      this.penguin.root.position.z,
      this.bounds.minZ,
      this.bounds.maxZ
    );

    // Archway divider wall collision in Wedding Hall (open center doorway [-2.05, 2.05])
    if (this.weddingStations.length > 0) {
      const px = this.penguin.root.position.x;
      const pz = this.penguin.root.position.z;
      if (Math.abs(pz) < 0.65 && Math.abs(px) > 1.95) {
        this.penguin.root.position.z = pz >= 0 ? 0.65 : -0.65;
      }
    }

    // Check proximity to artworks & wedding stations
    let closestIdx: number | null = null;
    let closestDist = 3.6;
    for (const placed of this.placedArtworks) {
      const d = this.penguin.root.position.distanceTo(placed.standPos);
      if (d < closestDist) {
        closestDist = d;
        closestIdx = placed.index;
      }
    }

    let closestStation: WeddingStationType | null = null;
    let closestStationDist = 2.95;
    for (const st of this.weddingStations) {
      const d = this.penguin.root.position.distanceTo(st.pos);
      if (d < closestStationDist) {
        closestStationDist = d;
        closestStation = st.type;
      }
    }

    if (closestIdx !== this.nearbyArtworkIdx || closestStation !== this.nearbyStation) {
      this.nearbyArtworkIdx = closestIdx;
      this.nearbyStation = closestStation;
      if (closestIdx !== null) {
        this.markViewed(closestIdx);
      }
      this.emitStats();
    }

    return moveSpeed;
  }

  private updateCamera(dt: number): void {
    this.camYaw = THREE.MathUtils.damp(this.camYaw, this.targetYaw, 9, dt);
    this.camPitch = THREE.MathUtils.damp(this.camPitch, this.targetPitch, 9, dt);
    this.camDist = THREE.MathUtils.damp(this.camDist, this.targetDist, 9, dt);

    _camTarget.copy(this.penguin.root.position);
    _camTarget.y += this.penguin.gender === 'girl' ? 1.26 : 1.32;

    const horizDist = Math.cos(this.camPitch) * this.camDist;
    const vertOffset = Math.sin(this.camPitch) * this.camDist;

    _camDesired.set(
      _camTarget.x + Math.sin(this.camYaw) * horizDist,
      _camTarget.y + vertOffset + 0.35,
      _camTarget.z + Math.cos(this.camYaw) * horizDist
    );

    // Keep camera inside room walls so it never clips outside
    _camDesired.x = THREE.MathUtils.clamp(_camDesired.x, this.bounds.minX - 0.4, this.bounds.maxX + 0.4);
    _camDesired.z = THREE.MathUtils.clamp(_camDesired.z, this.bounds.minZ - 0.6, this.bounds.maxZ + 0.8);
    _camDesired.y = THREE.MathUtils.clamp(_camDesired.y, 0.7, 4.8);

    this.camera.position.lerp(_camDesired, Math.min(1, dt * 10));
    _lookTarget.copy(_camTarget);
    _lookTarget.y += 0.35;
    this.camera.lookAt(_lookTarget);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 0.08);
    const elapsed = this.clock.elapsedTime;

    const speed = this.updateMovementAndTour(dt);
    this.penguin.updateAnimation(dt, speed, this.initialWaveTimer > 0);
    this.updateCamera(dt);

    // Subtle candle flame flicker & floating station icons
    for (let i = 0; i < this.animatedFlames.length; i++) {
      const f = this.animatedFlames[i];
      const s = 0.92 + Math.sin(elapsed * 8.5 + i * 1.7) * 0.14;
      f.scale.set(0.75, 1.55 * s, 0.75);
    }

    for (let i = 0; i < this.weddingStations.length; i++) {
      const anim = this.weddingStations[i].animatedMesh;
      if (anim) {
        anim.position.y = 1.72 + Math.sin(elapsed * 2.4 + i) * 0.07;
        anim.rotation.y = elapsed * 0.75;
      }
    }

    if (this.dustPoints) {
      this.dustPoints.rotation.y = elapsed * 0.015;
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private startLoop(): void {
    this.clock.start();
    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(this.tick, 0);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('wheel', this.onWheel);
    dom.removeEventListener('webglcontextlost', this.onContextLost);

    this.clearCurrentMuseum();
    this.boyRig.dispose();
    this.girlRig.dispose();
    this.envRT?.dispose();
    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}
