import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {entity} from './entity.js'
import {TerrainChunk} from './TerrainChunk.js'
import {HeightGenerator} from './HeightGenerator.js'


export  class TerrainChunkManager extends entity.Component {
    constructor(params) {
      super();
      this._chunkSize = 500;
      this._components=[];
      this._Init(params);
    }
  
    _Init(params) {
      //this._InitNoise(params);
      this._InitTerrain(params);
    }
  
    SetName(e){
      this._name=e;
    }
  
    GetComponent(n) {
      return this._components[n];
    }
  
    _InitNoise(params) {
      params.guiParams.noise = {
        octaves: 10,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 3.9,
        height: 64,
        scale: 256.0,
        noiseType: 'simplex',
        seed: 1
      };
  
      const onNoiseChanged = () => {
        for (let k in this._chunks) {
          this._chunks[k].chunk.Rebuild();
        }
      };
  
      const noiseRollup = params.gui.addFolder('Terrain.Noise');
      noiseRollup.add(params.guiParams.noise, "noiseType", ['simplex', 'perlin']).onChange(
          onNoiseChanged);
      noiseRollup.add(params.guiParams.noise, "scale", 64.0, 1024.0).onChange(
          onNoiseChanged);
      noiseRollup.add(params.guiParams.noise, "octaves", 1, 20, 1).onChange(
          onNoiseChanged);
      noiseRollup.add(params.guiParams.noise, "persistence", 0.01, 1.0).onChange(
          onNoiseChanged);
      noiseRollup.add(params.guiParams.noise, "lacunarity", 0.01, 4.0).onChange(
          onNoiseChanged);
      noiseRollup.add(params.guiParams.noise, "exponentiation", 0.1, 10.0).onChange(
          onNoiseChanged);
      noiseRollup.add(params.guiParams.noise, "height", 0, 256).onChange(
          onNoiseChanged);
  
      this._noise = new noise.Noise(params.guiParams.noise);
  
      params.guiParams.heightmap = {
        height: 16,
      };
  
      const heightmapRollup = params.gui.addFolder('Terrain.Heightmap');
      heightmapRollup.add(params.guiParams.heightmap, "height", 0, 128).onChange(
          onNoiseChanged);
    }
  
    _InitTerrain(params) {
      
  
      this._group = new THREE.Group()
      this._group.rotation.x = -Math.PI / 2;
      params.scene.add(this._group);
  
  
      this._chunks = {};
      this._params = params;
  
      // DEMO
      // this._AddChunk(0, 0);
  
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          this._AddChunk(x, z);
        }
      }
    }
  
    _Key(x, z) {
      return x + '.' + z;
    }
  
    _AddChunk(x, z) {
      const offset = new THREE.Vector2(x * this._chunkSize, z * this._chunkSize);
      const chunk = new TerrainChunk({
        group: this._group,
        offset: new THREE.Vector3(offset.x, offset.y, 0),
        scale: 1,
        width: this._chunkSize,
        heightGenerators: [new HeightGenerator(this._noise, offset, 100000, 100000 + 1)],
      });
  
      const k = this._Key(x, z);
      const edges = [];
      for (let xi = -1; xi <= 1; xi++) {
        for (let zi = -1; zi <= 1; zi++) {
          if (xi == 0 || zi == 0) {
            continue;
          }
          edges.push(this._Key(x + xi, z + zi));
        }
      }
  
      this._chunks[k] = {
        chunk: chunk,
        edges: edges
      };
    }
  
    SetHeightmap(img) {
      const heightmap = new HeightGenerator(
          new Heightmap(this._params.guiParams.heightmap, img),
          new THREE.Vector2(0, 0), 250, 300);
  
      for (let k in this._chunks) {
        this._chunks[k].chunk._params.heightGenerators.unshift(heightmap);
        this._chunks[k].chunk.Rebuild();
      }
    }
  
    Update(timeInSeconds) {
    }
  }
