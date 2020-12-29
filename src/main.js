import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import { third_person_camera } from './third-person-camera.js';
import { entity_manager } from './entity-manager.js';
import { player_entity } from './player-entity.js'
import { entity } from './entity.js';
import { gltf_component } from './gltf-component.js';
import { health_component } from './health-component.js';
import { player_input } from './player-input.js';
import { npc_entity } from './npc-entity.js';
import { math } from './math.js';
import { spatial_hash_grid } from './spatial-hash-grid.js';
import { ui_controller } from './ui-controller.js';
import { health_bar } from './health-bar.js';
import { level_up_component } from './level-up-component.js';
import { quest_component } from './quest-component.js';
import { spatial_grid_controller } from './spatial-grid-controller.js';
import { inventory_controller } from './inventory-controller.js';
import { equip_weapon_component } from './equip-weapon-component.js';
import { attack_controller } from './attacker-controller.js';


import { PickHelper } from './PickHelper.js';

const fov = 60;
const aspect = 1360 / 720;
const near = 1.0;
const far = 1000.0;
const const_camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

const const_scene = new THREE.Scene();

let const_pickPosition = { y: 0, x: 0 };
let const_prevpickPosition = { y: 0, x: 0 };
let const_pickhelper = new PickHelper();

let mousePosition = ((evt) => {
  const_pickPosition = { x: evt.clientX, y: evt.clientY };
  return const_pickPosition
});


class HackNSlashDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {

    this._LoadSystem();

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);


    this._LoadLights();
    this._LoadPlane("./resources/fu.jpg", 5000, 5000, false, true, -Math.PI / 2, 0);

    this._LoadControllers();
    this._LoadPlayer();
   // this._LoadFoliage();
   // this._LoadClouds();
    this._LoadSky();
    //this._LoadBuildings();
  //  this._loadMonsters();

    this._previousRAF = null;
    this._pickHelper = const_pickhelper;

    this._RAF();
  }

  _AddObject(resourcepath, name, fileFormat, coordX, coordY, coordZ, scale, doesReceiveShadow, doesCastShadow, indexSuffix = '', maxIndex = 1) {
    const index = math.rand_int(1, maxIndex);
    const pos = new THREE.Vector3(
      coordX, coordY, coordZ);

    const e = new entity.Entity();
    e.AddComponent(new gltf_component.StaticModelComponent({
      scene: const_scene,
      resourcePath: resourcepath,//'./resources/nature/FBX/',
      resourceName: name + indexSuffix + index + fileFormat,
      scale: scale,
      emissive: new THREE.Color(0x000000),
      specular: new THREE.Color(0x000000),
      receiveShadow: doesReceiveShadow,
      castShadow: doesCastShadow,
    }));

    e.AddComponent(
      new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
    e.SetPosition(pos);
    this._entityManager.Add(e);
    e.SetActive(false);

  }

  _LoadSystem() {

    this._threejs = new THREE.WebGLRenderer({
      antialias: false,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';

    document.getElementById('container').appendChild(this._threejs.domElement);


    const_camera.position.set(25, 10, 25);
    const_camera.isPerspectiveCamera = true;


    const_scene.castShadow = true;
    const_scene.background = new THREE.Color(0xFFFFFF);
    const_scene.fog = new THREE.FogExp2(0x98a3a1, 0.002);


    this._entityManager = new entity_manager.EntityManager();
    this._grid = new spatial_hash_grid.SpatialHashGrid(
      [[-1000, -1000], [1000, 1000]], [100, 100]);


  }

  _LoadLights() {

    let light = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    light.position.set(-10, 500, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1000.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;

    const_scene.add(light);
    let light2 = new THREE.AmbientLight(0xEEFFAA, 0.4);
    const_scene.add(light2);
    this._sun = light;
  }

  _LoadPlane(texture, sizeX, sizeY, castshadow, receiveShadow, rotationX, rotationY) {
    var planeTex = THREE.ImageUtils.loadTexture(texture);
    planeTex.wrapS = planeTex.wrapT = THREE.RepeatWrapping;
    planeTex.repeat.set(128, 128);
    var planeMat = new THREE.MeshBasicMaterial({ map: planeTex });

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(sizeX, sizeY),
      planeMat);
    plane.castShadow = castshadow;
    plane.receiveShadow = receiveShadow;
    plane.rotation.x = rotationX;
    plane.rotation.y = rotationY;
    const_scene.add(plane);
  }

  _LoadControllers() {
    const ui = new entity.Entity();
    ui.AddComponent(new ui_controller.UIController());
    this._entityManager.Add(ui, 'ui');
  }

  _LoadSky() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/posx.jpg',
      './resources/negx.jpg',
      './resources/posy.jpg',
      './resources/negy.jpg',
      './resources/posz.jpg',
      './resources/negz.jpg',
    ]);
    const_scene.background = texture;

  }

  _LoadClouds() {
    for (let i = 0; i < 10; ++i) {
      this._AddObject('./resources/nature2/GLTF/',
        'Cloud',
        '.glb',
        (Math.random() * 2.0 - 1.0) * 500,
        100,
        (Math.random() * 2.0 - 1.0) * 500,
        Math.random() * 5 + 10,
        true,
        true,
        '',
        3
      );
    }
  }


  _LoadFoliage() {
    for (let i = 0; i < 10; ++i) {

      const names = [
        'CommonTree_Dead_Snow', 'CommonTree_Snow',
        'BirchTree_Snow', 'BirchTree_Dead_Snow',
        'Willow_Snow', 'Willow_Dead_Snow',
        'PineTree_Snow',
      ];
      const name = names[math.rand_int(0, names.length - 1)];

      this._AddObject(
        './resources/nature/FBX/',
        name,
        '.fbx',
        (Math.random() * 2.0 - 1.0) * 200,
        0,
        (Math.random() * 2.0 - 1.0) * 200,
        0.25,
        true,
        true,
        '_',
        5);
    }
  }

  _LoadBuildings() {

    this._AddObject(
      './resources/haz/',
      'nyitotthaz',
      '.fbx', 100, 0, 100, 0.1, true, true, '');
    for (let i = 0; i < 2; ++i) {
      this._AddObject(
        './resources/haz/',
        'haz2',
        '.fbx', math.rand_range(-400,400), 0,  math.rand_range(-400,400), 0.05, true, true, '');
    }

  }


  _LoadPlayer() {
    const params = {
      camera: const_camera,
      scene: const_scene,
    };

    /* const levelUpSpawner = new entity.Entity();
     levelUpSpawner.AddComponent(new level_up_component.LevelUpComponentSpawner({
       camera: const_camera,
       scene: const_scene,
     }));
     this._entityManager.Add(levelUpSpawner, 'level-up-spawner');
 */

    const axe = new entity.Entity();
    axe.AddComponent(new inventory_controller.InventoryItem({
      type: 'weapon',
      damage: 3,
      renderParams: {
        name: 'Axe',
        scale: 0.25,
        icon: 'war-axe-64.png',
      },
    }));
    this._entityManager.Add(axe);

    const sword = new entity.Entity();
    sword.AddComponent(new inventory_controller.InventoryItem({
      type: 'weapon',
      damage: 3,
      renderParams: {
        name: 'Sword',
        scale: 0.25,
        icon: 'pointy-sword-64.png',
      },
    }));
    this._entityManager.Add(sword);

    const girl = new entity.Entity();
    girl.AddComponent(new gltf_component.AnimatedModelComponent({
      scene: const_scene,
      resourcePath: './resources/girl/',
      resourceName: 'peasant_girl.fbx',
      resourceAnimation: 'Standing Idle.fbx',
      scale: 0.035,
      receiveShadow: true,
      castShadow: true,
    }));
    girl.AddComponent(new spatial_grid_controller.SpatialGridController({
      grid: this._grid,
    }));
    girl.AddComponent(new player_input.PickableComponent());
    girl.AddComponent(new quest_component.QuestComponent());
    girl.SetPosition(new THREE.Vector3(30, 0, 30));
    this._entityManager.Add(girl);

    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(params));
    player.AddComponent(new player_entity.BasicCharacterController(params));
    player.AddComponent(
      new equip_weapon_component.EquipWeapon({ anchor: 'RightHandIndex1' }));
    player.AddComponent(new inventory_controller.InventoryController(params));
    player.AddComponent(new health_component.HealthComponent({
      updateUI: true,
      health: 100,
      maxHealth: 100,
      strength: 50,
      wisdomness: 5,
      benchpress: 20,
      curl: 100,
      experience: 0,
      level: 1,
    }));
    player.AddComponent(
      new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
    player.AddComponent(new attack_controller.AttackController({ timing: 0.7 }));
    this._entityManager.Add(player, 'player');

    player.Broadcast({
      topic: 'inventory.add',
      value: axe.Name,
      added: false,
    });

    player.Broadcast({
      topic: 'inventory.add',
      value: sword.Name,
      added: false,
    });

    player.Broadcast({
      topic: 'inventory.equip',
      value: sword.Name,
      added: false,
    });

    const camera = new entity.Entity();
    camera.AddComponent(
      new third_person_camera.ThirdPersonCamera({
        camera: const_camera,
        target: this._entityManager.Get('player')
      }));
    this._entityManager.Add(camera, 'player-camera');
  
  }

  _loadMonsters(){
    
    for (let i = 0; i < 10; ++i) {
      const monsters = [
        {
          resourceName: 'Ghost.fbx',
          resourceTexture: 'Ghost_Texture.png',
        },
        {
          resourceName: 'Alien.fbx',
          resourceTexture: 'Alien_Texture.png',
        },
        {
          resourceName: 'Skull.fbx',
          resourceTexture: 'Skull_Texture.png',
        },
        {
          resourceName: 'GreenDemon.fbx',
          resourceTexture: 'GreenDemon_Texture.png',
        },
        {
          resourceName: 'Cyclops.fbx',
          resourceTexture: 'Cyclops_Texture.png',
        },
        {
          resourceName: 'Cactus.fbx',
          resourceTexture: 'Cactus_Texture.png',
        },
      ];
      const m = monsters[math.rand_int(0, monsters.length - 1)];

      const npc = new entity.Entity();
      npc.AddComponent(new npc_entity.NPCController({
        camera: const_camera,
        scene: const_scene,
        resourceName: m.resourceName,
        resourceTexture: m.resourceTexture,
      }));
      npc.AddComponent(
        new health_component.HealthComponent({
          health: 50,
          maxHealth: 50,
          strength: 2,
          wisdomness: 2,
          benchpress: 3,
          curl: 1,
          experience: 0,
          level: 1,
          camera: const_camera,
          scene: const_scene,
        }));
      npc.AddComponent(
        new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
      npc.AddComponent(new health_bar.HealthBar({
        parent: const_scene,
        camera: const_camera,
      }));
      npc.AddComponent(new attack_controller.AttackController({ timing: 0.35 }));
      npc.SetPosition(new THREE.Vector3(
        (Math.random() * 2 - 1) * 500,
        0,
        (Math.random() * 2 - 1) * 500));
      this._entityManager.Add(npc);
    }
  }
  _OnWindowResize() {
    const_camera.aspect = window.innerWidth / window.innerHeight;
    const_camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(const_scene, const_camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._entityManager.Update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new HackNSlashDemo();
  document.addEventListener('mousemove', (e) => { const_pickhelper.pick(const_pickPosition, const_scene, const_camera) }, false);
});


