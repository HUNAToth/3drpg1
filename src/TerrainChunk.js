import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {entity} from './entity.js'

export class TerrainChunk extends entity.Component{
    constructor(params) {
      super();
      this._params = params;
      this._Init(params);
    }
  
    _Init(params) {
      const size = new THREE.Vector3(
          params.width * params.scale, 0, params.width * params.scale);
  
      this._plane = new THREE.Mesh(
          new THREE.PlaneGeometry(size.x, size.z, 128, 128),
          new THREE.MeshStandardMaterial({
              wireframe: false,
              color: 0xFFFFFF,
              side: THREE.FrontSide,
              vertexColors: THREE.VertexColors,
          }));
      this._plane.position.add(params.offset);
      this._plane.castShadow = false;
      this._plane.receiveShadow = true;
      params.group.add(this._plane);
  
      this.Rebuild();
    }
  
    Rebuild() {
      const offset = this._params.offset;
      for (let v of this._plane.geometry.vertices) {
        const heightPairs = [];
        let normalization = 0;
        v.z = 0;
        for (let gen of this._params.heightGenerators) {
          heightPairs.push(gen.Get(v.x + offset.x, v.y + offset.y));
          normalization += heightPairs[heightPairs.length-1][1];
        }
  
        if (normalization > 0) {
          for (let h of heightPairs) {
            v.z += h[0] * h[1] / normalization;
          }
        }
      }
  
      // DEMO
      if (this._params.heightGenerators.length > 1 && offset.x == 0 && offset.y == 0) {
        const gen = this._params.heightGenerators[0];
        const maxHeight = 16.0;
        const GREEN = new THREE.Color(0x46b00c);
  
        for (let f of this._plane.geometry.faces) {
          const vs = [
              this._plane.geometry.vertices[f.a],
              this._plane.geometry.vertices[f.b],
              this._plane.geometry.vertices[f.c]
          ];
  
          const vertexColours = [];
          for (let v of vs) {
            const [h, _] = gen.Get(v.x + offset.x, v.y + offset.y);
            const a = math.sat(h / maxHeight);
            const vc = new THREE.Color(0xFFFFFF);
            vc.lerp(GREEN, a);
  
            vertexColours.push(vc);
          }
          f.vertexColors = vertexColours;
        }
        this._plane.geometry.elementsNeedUpdate = true;
      } else {
        for (let f of this._plane.geometry.faces) {
          f.vertexColors = [
              new THREE.Color(0xFFFFFF),
              new THREE.Color(0xFFFFFF),
              new THREE.Color(0xFFFFFF),
          ];
        }
  
      }
      this._plane.geometry.verticesNeedUpdate = true;
      this._plane.geometry.computeVertexNormals();
    }
  }