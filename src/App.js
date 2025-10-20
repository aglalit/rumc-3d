import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';

const GRID_SIZE = 3;
const FACE_KEYS = ['base', 'right', 'left'];
const FACE_TITLES = {
    base: 'Основание',
    right: 'Правая грань',
    left: 'Левая грань'
};
const PRISM_NAMES = ['Самопроектирование', 'Самореализация', 'Идентификация', 'Адаптация'];

const createTextSprite = (text, { color = '#f8f9fa', fontSize = 26, padding = 6 } = {}) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = `${fontSize}px "Arial"`;
    context.font = font;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    context.font = font;
    context.fillStyle = 'rgba(20, 20, 20, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.textBaseline = 'top';
    context.fillText(text, padding, padding);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    const scaleFactor = 0.012;
    sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);
    return sprite;
};

const generateButtonContent = (prismName, faceKey, rowIndex, colIndex) => {
    const rowLabels = ['A', 'B', 'C'];
    const columnLabels = ['1', '2', '3'];
    return {
        title: `${prismName} — ${FACE_TITLES[faceKey]} (${rowLabels[rowIndex]}${columnLabels[colIndex]})`,
        description: `Описание для сектора ${rowLabels[rowIndex]}${columnLabels[colIndex]} на грани "${FACE_TITLES[faceKey]}" блока "${prismName}". Здесь можно разместить детализированную информацию о соответствующем направлении развития.`
    };
};

const ThreeScene = () => {
    const mountRef = useRef(null);
    const [selectedSector, setSelectedSector] = useState(null);

    const scene = useRef(null);
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const prismGroup = useRef(null);
    const raycaster = useRef(null);
    const animationId = useRef(null);
    const gridLabelsRef = useRef([]);
    const clickableObjects = useRef([]);

    useEffect(() => {
        if (!mountRef.current) {
            return;
        }

        scene.current = new THREE.Scene();
        scene.current.background = new THREE.Color(0xf3f4f8);

        camera.current = new THREE.PerspectiveCamera(
            60,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.current.position.set(10, 5, 10);

        renderer.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.current.setPixelRatio(window.devicePixelRatio);

        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }
        mountRef.current.appendChild(renderer.current.domElement);

        controls.current = new OrbitControls(camera.current, renderer.current.domElement);
        controls.current.enableDamping = true;
        controls.current.dampingFactor = 0.08;
        controls.current.enablePan = false;
        controls.current.enableRotate = true;
        controls.current.enableZoom = true;
        controls.current.minPolarAngle = Math.PI / 2;
        controls.current.maxPolarAngle = Math.PI / 2;
        controls.current.minDistance = 6;
        controls.current.maxDistance = 18;
        controls.current.target.set(0, 0, 0);
        controls.current.update();

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
        scene.current.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(6, 10, 8);
        scene.current.add(directionalLight);

        prismGroup.current = new THREE.Group();
        scene.current.add(prismGroup.current);

        const baseLength = 3.6;
        const prismHeight = 2.6;
        const prismSpacing = 0.8;
        const buttonGap = 0.14;
        const margin = 0.2;
        const buttonDepth = 0.22;
        const triangleHeight = Math.sqrt(3) / 2 * baseLength;

        const triangleVertices = [
            new THREE.Vector3(-baseLength / 2, 0, -triangleHeight / 3),
            new THREE.Vector3(baseLength / 2, 0, -triangleHeight / 3),
            new THREE.Vector3(0, 0, (2 * triangleHeight) / 3)
        ];
        const centroid = triangleVertices[0].clone().add(triangleVertices[1]).add(triangleVertices[2]).divideScalar(3);
        triangleVertices.forEach(vertex => vertex.sub(centroid));

        const faceDefinitions = [
            { key: 'base', startIndex: 0, endIndex: 1 },
            { key: 'right', startIndex: 1, endIndex: 2 },
            { key: 'left', startIndex: 2, endIndex: 0 }
        ];

        const faceColors = {
            base: 0xff6b6b,
            right: 0x4ecdc4,
            left: 0x5c7cfa
        };

        const heightAxis = new THREE.Vector3(0, 1, 0);

        const faceData = faceDefinitions.map(def => {
            const start = triangleVertices[def.startIndex];
            const end = triangleVertices[def.endIndex];
            const edgeVector = end.clone().sub(start);
            const length = edgeVector.length();
            const widthAxis = edgeVector.clone().normalize();
            let normal = new THREE.Vector3().crossVectors(widthAxis, heightAxis).normalize();
            const faceCenter = start.clone().add(end).multiplyScalar(0.5);
            const directionFromCenter = faceCenter.clone().sub(new THREE.Vector3(0, 0, 0));
            if (directionFromCenter.dot(normal) < 0) {
                normal = normal.multiplyScalar(-1);
            }
            const basisMatrix = new THREE.Matrix4().makeBasis(widthAxis, heightAxis, normal);
            const quaternion = new THREE.Quaternion().setFromRotationMatrix(basisMatrix);
            return {
                key: def.key,
                start,
                end,
                length,
                center: faceCenter,
                widthAxis,
                normal,
                quaternion
            };
        });

        const gridAvailable = baseLength - margin * 2;
        const buttonSize = (gridAvailable - buttonGap * (GRID_SIZE - 1)) / GRID_SIZE;

        const createFaceLabels = (faceKey, faceGroup, faceLength) => {
            const rowLabels = ['A', 'B', 'C'];
            const columnLabels = ['1', '2', '3'];

            rowLabels.forEach((label, rowIndex) => {
                const sprite = createTextSprite(label, { fontSize: 24, padding: 4 });
                const localY = prismHeight / 2 - margin - buttonSize / 2 - rowIndex * (buttonSize + buttonGap);
                const localX = -faceLength / 2 + margin / 2;
                sprite.position.set(localX, localY, 0.02);
                faceGroup.add(sprite);
                gridLabelsRef.current.push(sprite);
            });

            columnLabels.forEach((label, columnIndex) => {
                const sprite = createTextSprite(label, { fontSize: 24, padding: 4 });
                const localX = -faceLength / 2 + margin + columnIndex * (buttonSize + buttonGap) + buttonSize / 2;
                const localY = prismHeight / 2 - margin / 2;
                sprite.position.set(localX, localY, 0.02);
                faceGroup.add(sprite);
                gridLabelsRef.current.push(sprite);
            });
        };

        const createButton = (faceKey, faceGroup, prismIndex, prismName, faceLength, rowIndex, colIndex) => {
            const material = new THREE.MeshStandardMaterial({
                color: faceColors[faceKey],
                metalness: 0.25,
                roughness: 0.45
            });

            const localX = -faceLength / 2 + margin + buttonSize / 2 + colIndex * (buttonSize + buttonGap);
            const localY = prismHeight / 2 - margin - buttonSize / 2 - rowIndex * (buttonSize + buttonGap);

            const geometry = new THREE.BoxGeometry(buttonSize, buttonSize, buttonDepth);
            const button = new THREE.Mesh(geometry, material);
            button.position.set(localX, localY, buttonDepth / 2 + 0.01);
            button.castShadow = true;
            button.receiveShadow = true;

            const content = generateButtonContent(prismName, faceKey, rowIndex, colIndex);
            button.userData = {
                type: 'button',
                prismIndex,
                faceKey,
                rowIndex,
                colIndex,
                ...content
            };

            faceGroup.add(button);
            clickableObjects.current.push(button);
        };

        const createPrism = (index) => {
            const prism = new THREE.Group();
            prism.position.y = index * (prismHeight + prismSpacing) - ((prismHeight + prismSpacing) * (PRISM_NAMES.length - 1)) / 2;
            prism.userData = { type: 'prism-base', index };
            prismGroup.current.add(prism);

            faceData.forEach((faceInfo) => {
                const faceGroup = new THREE.Group();
                faceGroup.position.copy(faceInfo.center);
                faceGroup.quaternion.copy(faceInfo.quaternion);

                const faceMaterial = new THREE.MeshStandardMaterial({
                    color: faceColors[faceInfo.key],
                    metalness: 0.2,
                    roughness: 0.6,
                    opacity: 0.4,
                    transparent: true,
                    side: THREE.DoubleSide
                });

                const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(faceInfo.length, prismHeight), faceMaterial);
                facePlane.position.set(0, 0, -0.02);
                facePlane.receiveShadow = true;
                faceGroup.add(facePlane);

                FACE_KEYS.forEach((key) => {
                    if (key === faceInfo.key) {
                        for (let rowIndex = 0; rowIndex < GRID_SIZE; rowIndex++) {
                            for (let colIndex = 0; colIndex < GRID_SIZE; colIndex++) {
                                createButton(key, faceGroup, index, PRISM_NAMES[index], faceInfo.length, rowIndex, colIndex);
                            }
                        }
                        createFaceLabels(key, faceGroup, faceInfo.length);
                    }
                });

                prism.add(faceGroup);
            });
        };

        PRISM_NAMES.forEach((_, index) => {
            createPrism(index);
        });

        const axisHeight = PRISM_NAMES.length * (prismHeight + prismSpacing) + 1.2;
        const axisGeometry = new THREE.CylinderGeometry(0.16, 0.16, axisHeight, 24);
        const axisMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3542, metalness: 0.6, roughness: 0.2 });
        const axis = new THREE.Mesh(axisGeometry, axisMaterial);
        axis.position.set(0, 0, 0);
        axis.castShadow = true;
        axis.receiveShadow = true;
        prismGroup.current.add(axis);

        raycaster.current = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleResize = () => {
            if (!mountRef.current) return;
            camera.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        const handleClick = (event) => {
            if (!renderer.current) return;
            const rect = renderer.current.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.current.setFromCamera(mouse, camera.current);
            const intersects = raycaster.current.intersectObjects(clickableObjects.current, false);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.type === 'button') {
                    setSelectedSector({
                        id: `prism${object.userData.prismIndex}_${object.userData.faceKey}_${object.userData.rowIndex}_${object.userData.colIndex}`,
                        title: object.userData.title,
                        description: object.userData.description
                    });
                }
            }
        };

        renderer.current.domElement.addEventListener('click', handleClick);
        renderer.current.domElement.style.cursor = 'pointer';

        const animate = () => {
            animationId.current = requestAnimationFrame(animate);
            controls.current.update();
            renderer.current.render(scene.current, camera.current);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);

            if (renderer.current) {
                renderer.current.domElement.removeEventListener('click', handleClick);
            }

            if (animationId.current) {
                cancelAnimationFrame(animationId.current);
            }

            if (renderer.current && renderer.current.domElement.parentNode === mountRef.current) {
                mountRef.current.removeChild(renderer.current.domElement);
            }

            gridLabelsRef.current.forEach(sprite => {
                if (sprite && sprite.material && sprite.material.map) {
                    sprite.material.map.dispose();
                    sprite.material.dispose();
                }
            });
            gridLabelsRef.current = [];

            clickableObjects.current = [];

            if (controls.current) {
                controls.current.dispose();
            }

            if (renderer.current) {
                renderer.current.dispose();
            }

            if (scene.current) {
                scene.current.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach((material) => material.dispose());
                        } else if (object.material.dispose) {
                            object.material.dispose();
                        }
                    }
                });
            }
        };
    }, []);

    const closeModal = () => {
        setSelectedSector(null);
    };

    return (
        <div className="app">
            <div className="header">
                <h1>Инклюзивная трансформация образовательной экосреды университета</h1>
                <p>На основе принципов универсального дизайна</p>
            </div>

            <div className="content">
                <div className="instructions">
                    <p>🎯 Кликните на любой сектор модели для просмотра информации</p>
                    <p>🖱️ Удерживайте левую кнопку мыши для поворота вокруг оси</p>
                    <p>🔍 Используйте колесико мыши для приближения и отдаления</p>
                </div>

                <div className="visualization">
                    <div ref={mountRef} className="canvas-container" />
                    <div className="prism-legend">
                        {PRISM_NAMES.map((name) => (
                            <div key={name} className="legend-item">{name}</div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedSector && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h2>{selectedSector.title}</h2>
                        <p>{selectedSector.description}</p>
                        <div className="modal-actions">
                            <button className="action-button">Подробнее</button>
                            <button className="action-button">Скачать материалы</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThreeScene;
