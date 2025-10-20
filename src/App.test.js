import { render, screen } from '@testing-library/react';

jest.mock('three', () => {
  const createCanvas = () => {
    if (global.document && typeof global.document.createElement === 'function') {
<<<<<<< ours
      return global.document.createElement('canvas');
=======
      const canvas = global.document.createElement('canvas');
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
      canvas.addEventListener = () => {};
      canvas.removeEventListener = () => {};
      canvas.style = {};
      return canvas;
>>>>>>> theirs
    }
    return {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {}
    };
  };

<<<<<<< ours
=======
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    set(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    copy(vector) {
      this.x = vector.x;
      this.y = vector.y;
      this.z = vector.z;
      return this;
    }
    clone() {
      return new Vector3(this.x, this.y, this.z);
    }
    add(vector) {
      this.x += vector.x;
      this.y += vector.y;
      this.z += vector.z;
      return this;
    }
    sub(vector) {
      this.x -= vector.x;
      this.y -= vector.y;
      this.z -= vector.z;
      return this;
    }
    multiplyScalar(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }
    divideScalar(scalar) {
      if (scalar !== 0) {
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
      }
      return this;
    }
    length() {
      return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2) || 1;
    }
    normalize() {
      return this.divideScalar(this.length());
    }
    crossVectors(a, b) {
      const ax = a.x, ay = a.y, az = a.z;
      const bx = b.x, by = b.y, bz = b.z;
      this.x = ay * bz - az * by;
      this.y = az * bx - ax * bz;
      this.z = ax * by - ay * bx;
      return this;
    }
    dot(vector) {
      return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }
    addVectors(a, b) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      return this;
    }
    project() {
      return { x: 0, y: 0 };
    }
  }

  class Vector2 {
    constructor() {
      this.x = 0;
      this.y = 0;
    }
  }

  class Matrix4 {
    makeBasis() {
      return this;
    }
  }

  class Quaternion {
    constructor() {
      this.value = null;
    }
    setFromRotationMatrix(matrix) {
      this.value = matrix;
      return this;
    }
    copy(quaternion) {
      this.value = quaternion.value;
      return this;
    }
  }

>>>>>>> theirs
  class Scene {
    constructor() {
      this.children = [];
      this.background = null;
    }
    add(object) {
      this.children.push(object);
    }
    remove(object) {
      this.children = this.children.filter((child) => child !== object);
    }
    traverse() {}
  }

  class PerspectiveCamera {
    constructor() {
      this.position = { set: () => {} };
      this.aspect = 1;
    }
    updateProjectionMatrix() {}
  }

  class WebGLRenderer {
    constructor() {
      this.domElement = createCanvas();
<<<<<<< ours
      this.domElement.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
      this.domElement.addEventListener = () => {};
      this.domElement.removeEventListener = () => {};
      this.domElement.style = {};
=======
>>>>>>> theirs
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
  }

  class AmbientLight {
    constructor() {}
  }

  class DirectionalLight {
    constructor() {
      this.position = { set: () => {} };
    }
  }

  class Group {
    constructor() {
      this.children = [];
<<<<<<< ours
      this.rotation = { y: 0 };
=======
      this.position = new Vector3();
      this.quaternion = new Quaternion();
      this.userData = {};
>>>>>>> theirs
    }
    add(child) {
      this.children.push(child);
    }
    remove(child) {
      this.children = this.children.filter((item) => item !== child);
    }
  }

  class Mesh {
    constructor() {
      this.children = [];
<<<<<<< ours
      this.position = { set: () => {} };
      this.rotation = {};
=======
      this.position = new Vector3();
      this.rotation = {};
      this.quaternion = new Quaternion();
>>>>>>> theirs
      this.userData = {};
      this.castShadow = false;
      this.receiveShadow = false;
      this.geometry = {};
      this.material = {};
    }
    add(child) {
      this.children.push(child);
    }
    getWorldPosition(vector) {
      if (vector && typeof vector.set === 'function') {
        vector.set(0, 0, 0);
      }
      return vector;
    }
  }

  class MeshStandardMaterial {
    constructor() {}
  }

<<<<<<< ours
  class BoxGeometry {
=======
  class PlaneGeometry {
>>>>>>> theirs
    constructor() {}
  }

  class CylinderGeometry {
    constructor() {}
  }

<<<<<<< ours
=======
  class Shape {
    moveTo() {}
    lineTo() {}
    quadraticCurveTo() {}
  }

  class ExtrudeGeometry {
    constructor() {}
    center() {
      return this;
    }
  }

>>>>>>> theirs
  class CanvasTexture {
    constructor() {
      this.needsUpdate = false;
    }
  }

  class SpriteMaterial {
    constructor() {
      this.map = null;
      this.depthTest = false;
<<<<<<< ours
      this.rotation = 0;
=======
>>>>>>> theirs
      this.dispose = () => {};
    }
  }

  class Sprite {
    constructor() {
      this.scale = { set: () => {} };
<<<<<<< ours
      this.position = { set: () => {} };
      this.material = { rotation: 0 };
=======
      this.position = new Vector3();
      this.material = { map: { dispose: () => {} }, dispose: () => {} };
>>>>>>> theirs
      this.userData = {};
    }
  }

  class Raycaster {
    constructor() {
      this.setFromCamera = () => {};
      this.intersectObjects = () => [];
    }
  }

<<<<<<< ours
  class Vector2 {
    constructor() {
      this.x = 0;
      this.y = 0;
    }
  }

  class Vector3 {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    project() {
      return { x: 0, y: 0 };
    }
    set() {}
  }

=======
>>>>>>> theirs
  class Color {
    constructor() {}
  }

  return {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    DirectionalLight,
    Group,
    Mesh,
    MeshStandardMaterial,
<<<<<<< ours
    BoxGeometry,
    CylinderGeometry,
=======
    PlaneGeometry,
    CylinderGeometry,
    Shape,
    ExtrudeGeometry,
>>>>>>> theirs
    CanvasTexture,
    SpriteMaterial,
    Sprite,
    Raycaster,
    Vector2,
    Vector3,
<<<<<<< ours
    Color
=======
    Matrix4,
    Quaternion,
    Color,
    DoubleSide: 'DoubleSide'
>>>>>>> theirs
  };
});

jest.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: class {
    constructor() {
      this.enableDamping = true;
      this.dampingFactor = 0.05;
      this.minPolarAngle = 0;
      this.maxPolarAngle = Math.PI;
      this.enableRotate = true;
      this.enablePan = false;
<<<<<<< ours
=======
      this.enableZoom = true;
      this.minDistance = 0;
      this.maxDistance = 0;
      this.target = { set: () => {} };
>>>>>>> theirs
    }
    update() {}
    dispose() {}
  }
}));

beforeAll(() => {
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = () => ({
      measureText: () => ({ width: 0 }),
      fillRect: () => {},
      fillText: () => {},
      clearRect: () => {}
    });
  }
});

import App from './App';

test('renders main header', () => {
  render(<App />);
  const header = screen.getByText(/Инклюзивная трансформация образовательной экосреды университета/i);
  expect(header).toBeInTheDocument();
});
