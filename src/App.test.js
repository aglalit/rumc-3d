import { render, screen } from '@testing-library/react';

jest.mock('three', () => {
  const createCanvas = () => {
    if (global.document && typeof global.document.createElement === 'function') {
      return global.document.createElement('canvas');
    }
    return {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {}
    };
  };

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
      this.domElement.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
      this.domElement.addEventListener = () => {};
      this.domElement.removeEventListener = () => {};
      this.domElement.style = {};
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
      this.rotation = { y: 0 };
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
      this.position = { set: () => {} };
      this.rotation = {};
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
      this.rotation = 0;
      this.dispose = () => {};
    }
  }

  class Sprite {
    constructor() {
      this.scale = { set: () => {} };
      this.position = { set: () => {} };
      this.material = { rotation: 0 };
      this.userData = {};
    }
  }

  class Raycaster {
    constructor() {
      this.setFromCamera = () => {};
      this.intersectObjects = () => [];
    }
  }

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
    BoxGeometry,
    CylinderGeometry,
    CanvasTexture,
    SpriteMaterial,
    Sprite,
    Raycaster,
    Vector2,
    Vector3,
    Color
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
