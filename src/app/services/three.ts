import { Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { GameService, GameState } from './game';

// Asset paths - user will provide these GLB files
const SPACESHIP_MODEL_PATH = 'assets/models/spaceship.glb';
const METEOR_MODEL_PATH = 'assets/models/meteor.glb';

@Injectable({
  providedIn: 'root',
})
export class ThreeService implements OnDestroy {
  private canvas!: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private animationId: number | null = null;
  private loader = new GLTFLoader();

  // Game Objects
  private spaceship!: THREE.Group;
  private meteorTemplate: THREE.Group | null = null;
  private obstacles: THREE.Group[] = [];
  private stars!: THREE.Points;

  // Loading state
  private modelsLoaded = false;

  // Gameplay variables
  private speed = 0.5;
  private shipTargetX = 0;
  private shipPositionX = 0;
  private obstacleSpawnTimer = 0;

  constructor(
    private ngZone: NgZone,
    private gameService: GameService,
  ) {}

  async init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Add a subtle backlight for better model visibility
    const backLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    backLight.position.set(-5, 5, -10);
    this.scene.add(backLight);

    this.createStars();

    // Load GLB models
    await this.loadModels();

    // Bind resize event
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start Loop
    this.animate();
  }

  private async loadModels(): Promise<void> {
    try {
      // Load spaceship
      const spaceshipGltf = await this.loadGLTF(SPACESHIP_MODEL_PATH);
      this.spaceship = spaceshipGltf.scene;
      this.spaceship.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed
      this.spaceship.position.set(0, 0, 4);
      this.scene.add(this.spaceship);

      // Load meteor template (we'll clone this for obstacles)
      const meteorGltf = await this.loadGLTF(METEOR_MODEL_PATH);
      this.meteorTemplate = meteorGltf.scene;
      this.meteorTemplate.scale.set(0.8, 0.8, 0.8); // Adjust scale as needed

      this.modelsLoaded = true;
      console.log('✅ GLB models loaded successfully');
    } catch (error) {
      console.warn('⚠️ GLB models not found, using fallback geometry:', error);
      // Fallback to geometric shapes if models aren't available yet
      this.createFallbackSpaceship();
      this.modelsLoaded = true;
    }
  }

  private loadGLTF(path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error),
      );
    });
  }

  private createFallbackSpaceship() {
    // Fallback geometric spaceship (used when GLB not available)
    this.spaceship = new THREE.Group();

    const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x004444,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2;
    this.spaceship.add(body);

    const engineGeo = new THREE.SphereGeometry(0.3);
    const engineMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = 1;
    this.spaceship.add(engine);

    this.scene.add(this.spaceship);
  }

  private createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starVertices = [];

    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private spawnObstacle() {
    let obstacle: THREE.Group;

    if (this.meteorTemplate) {
      // Clone the meteor model
      obstacle = this.meteorTemplate.clone();
    } else {
      // Fallback to cube if meteor model not loaded
      obstacle = new THREE.Group();
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.6,
        metalness: 0.3,
      });
      const cube = new THREE.Mesh(geometry, material);
      obstacle.add(cube);
    }

    // Random X position between -4 and 4
    obstacle.position.x = (Math.random() - 0.5) * 8;
    obstacle.position.y = 0;
    obstacle.position.z = -50;

    // Random initial rotation
    obstacle.rotation.x = Math.random() * Math.PI;
    obstacle.rotation.y = Math.random() * Math.PI;

    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  moveLeft() {
    if (this.shipTargetX > -4) this.shipTargetX -= 2;
  }

  moveRight() {
    if (this.shipTargetX < 4) this.shipTargetX += 2;
  }

  reset() {
    this.obstacles.forEach((obs) => this.scene.remove(obs));
    this.obstacles = [];
    this.shipTargetX = 0;
    this.shipPositionX = 0;
    this.speed = 0.5;
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      this.animationId = requestAnimationFrame(() => this.animate());
      this.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  private update() {
    // Starfield animation
    this.stars.rotation.z += 0.001;

    // Game Logic
    if (this.gameService.state() === GameState.PLAYING && this.modelsLoaded) {
      // Smooth ship movement
      this.shipPositionX += (this.shipTargetX - this.shipPositionX) * 0.1;
      this.spaceship.position.x = this.shipPositionX;

      // Tilt ship
      this.spaceship.rotation.z = -(this.shipTargetX - this.shipPositionX) * 0.5;

      // Obstacles
      this.obstacleSpawnTimer++;
      if (this.obstacleSpawnTimer > 60) {
        this.spawnObstacle();
        this.obstacleSpawnTimer = 0;
        this.speed += 0.001;
      }

      // Move obstacles and collision
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.position.z += this.speed;

        // Tumbling rotation for meteors
        obs.rotation.x += 0.02;
        obs.rotation.y += 0.015;

        // Collision Detection
        const distance = this.spaceship.position.distanceTo(obs.position);
        if (distance < 1.2) {
          this.ngZone.run(() => this.gameService.endGame());
        }

        // Remove if behind camera
        if (obs.position.z > 5) {
          this.scene.remove(obs);
          this.obstacles.splice(i, 1);
          this.ngZone.run(() => this.gameService.incrementScore());
        }
      }
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}
