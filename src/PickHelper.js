import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

 export class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
        //this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
        //this.pickedObject = undefined;
      }
      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);
      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);
//  console.log(intersectedObjects);
      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
   //     console.log(this.pickedObject);
        // save its color
        //this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // set its emissive color to flashing red/yellow
        //this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
      }
    }

    getCanvasRelativePosition(event,const_scene) {
        const rect = const_scene.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * const_scene.width  / rect.width,
          y: (event.clientY - rect.top ) * const_scene.height / rect.height,
        };
      }
    
    setPickPosition(event,const_scene) {
        const pos = this.getCanvasRelativePosition(event,const_scene);
        return { x: (pos.x / const_scene.width ) *  2 - 1,
             y: (pos.y / const_scene.height) * -2 + 1};  // note we flip Y}
      }
    
    clearPickPosition() {
        // unlike the mouse which always has a position
        // if the user stops touching the screen we want
        // to stop picking. For now we just pick a value
        // unlikely to pick something
        return { x: -11000,
            y: -11000};  // note we flip Y}
   
      }
  }

/*
  
  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);

  window.addEventListener('touchstart', (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, {passive: false});

  window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
  });

  window.addEventListener('touchend', clearPickPosition);

  */
 
export default PickHelper;