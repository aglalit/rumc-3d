import { render, screen } from '@testing-library/react';

jest.mock('three', () => {
  const createCanvas = () => {
    if (global.document && typeof global.document.createElement === 'function') {
      const canvas = global.document.createElement('canvas');
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
      canvas.addEventListener = () => {};
      canvas.removeEventListener = () => {};
      canvas.style = {};
      return canvas;
    }
    return {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {}
    };
  };

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
      this.position = new Vector3();
      this.quaternion = new Quaternion();
      this.userData = {};
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
      this.position = new Vector3();
      this.rotation = {};
      this.quaternion = new Quaternion();
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

  class PlaneGeometry {
    constructor() {}
  }

  class BoxGeometry {
    constructor() {}
  }

  class CylinderGeometry {
    constructor() {}
  }

  class CanvasTexture {
    constructor() {
      this.needsUpdate = false;
    }
  }

  class SpriteMaterial {
    constructor() {
      this.map = null;
      this.depthTest = false;
      this.dispose = () => {};
    }
  }

  class Sprite {
    constructor() {
      this.scale = { set: () => {} };
      this.position = new Vector3();
      this.material = { map: { dispose: () => {} }, dispose: () => {} };
      this.userData = {};
    }
  }

  class Raycaster {
    constructor() {
      this.setFromCamera = () => {};
      this.intersectObjects = () => [];
    }
  }

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
    PlaneGeometry,
    BoxGeometry,
    CylinderGeometry,
    CanvasTexture,
    SpriteMaterial,
    Sprite,
    Raycaster,
    Vector2,
    Vector3,
    Matrix4,
    Quaternion,
    Color,
    DoubleSide: 'DoubleSide'
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
      this.enableZoom = true;
      this.minDistance = 0;
      this.maxDistance = 0;
      this.target = { set: () => {} };
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
