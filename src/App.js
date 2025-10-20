import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';
import {
    GRID_SIZE,
    FACE_KEYS,
    FACE_TITLES,
    ROW_LABELS,
    COLUMN_LABELS,
    PRISM_NAMES
} from './prismConfig';

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
    return {
        title: `${prismName} — ${FACE_TITLES[faceKey]} (${ROW_LABELS[rowIndex]}${COLUMN_LABELS[colIndex]})`,
        description: `Описание для сектора ${ROW_LABELS[rowIndex]}${COLUMN_LABELS[colIndex]} на грани "${FACE_TITLES[faceKey]}" блока "${prismName}". Здесь можно разместить детализированную информацию о соответствующем направлении развития.`
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
    const labelsRef = useRef([]);
    const gridLabelsRef = useRef([]);
    const clickableObjects = useRef([]);
    const prismNames = ['Самопроектирование', 'Индивидуализация', 'Интеграция', 'Адаптация'];

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
        camera.current.position.set(10, 6, 12);

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

        const createPrismLabel = (index, text) => {
            const label = document.createElement('div');
            label.className = 'prism-label';
            label.textContent = text;
            label.style.position = 'absolute';
            label.style.color = 'white';
            label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            label.style.padding = '5px 10px';
            label.style.borderRadius = '5px';
            label.style.fontSize = '14px';
            label.style.pointerEvents = 'none';
            label.style.zIndex = '10';

            document.querySelector('.canvas-container').appendChild(label);
            labelsRef.current[index] = label;
        };

        prismGroup.current = new THREE.Group();
        scene.current.add(prismGroup.current);

        const updateLabelPositions = (activeCamera, activeGroup) => {
            if (!activeGroup.current || !mountRef.current) return;
            const rect = mountRef.current.getBoundingClientRect();

            activeGroup.current.children.forEach((object) => {
                if (!object.userData || object.userData.type !== 'prism-base') {
                    return;
                }

                const label = labelsRef.current[object.userData.index];
                if (!label) return;

                const worldPosition = new THREE.Vector3();
                object.getWorldPosition(worldPosition);
                const vector = worldPosition.project(activeCamera);

                const x = (vector.x * 0.5 + 0.5) * rect.width;
                const y = (-vector.y * 0.5 + 0.5) * rect.height;

                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.style.transform = 'translate(-50%, -50%)';
            });
        };

        const prismBaseSize = 3.2;
        const prismSpacing = 0.8;
        const prismHeight = prismBaseSize;
        const buttonGap = 0.15;
        const faceColors = {
            front: 0xff6b6b,
            back: 0xf4d35e,
            left: 0x4ecdc4,
            right: 0x5c7cfa
        };

        const margin = 0.25;
        const gridAvailable = prismBaseSize - margin * 2;
        const buttonSize = (gridAvailable - buttonGap * (GRID_SIZE - 1)) / GRID_SIZE;
        const buttonDepth = 0.22;

        const createButton = (faceKey, prismIndex, prismMesh, prismName, rowIndex, colIndex) => {
            let geometry;
            const material = new THREE.MeshStandardMaterial({
                color: faceColors[faceKey],
                metalness: 0.2,
                roughness: 0.35,
                emissive: 0x000000
            });

            const y = prismBaseSize / 2 - margin - buttonSize / 2 - rowIndex * (buttonSize + buttonGap);
            let button;

            if (faceKey === 'front' || faceKey === 'back') {
                geometry = new THREE.BoxGeometry(buttonSize, buttonSize, buttonDepth);
                const x = -prismBaseSize / 2 + margin + buttonSize / 2 + colIndex * (buttonSize + buttonGap);
                const zOffset = prismBaseSize / 2 + buttonDepth / 2;
                button = new THREE.Mesh(geometry, material);
                button.position.set(x, y, faceKey === 'front' ? zOffset : -zOffset);
                if (faceKey === 'back') {
                    button.rotation.y = Math.PI;
                }
            } else {
                geometry = new THREE.BoxGeometry(buttonDepth, buttonSize, buttonSize);
                const z = prismBaseSize / 2 - margin - buttonSize / 2 - colIndex * (buttonSize + buttonGap);
                const xOffset = prismBaseSize / 2 + buttonDepth / 2;
                button = new THREE.Mesh(geometry, material);
                button.position.set(faceKey === 'right' ? xOffset : -xOffset, y, faceKey === 'right' ? z : -z);
                if (faceKey === 'left') {
                    button.rotation.y = Math.PI;
                }
            }

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

            prismMesh.add(button);
            clickableObjects.current.push(button);
        };

        const createGridLabels = (faceKey, prismMesh) => {
            const rowLabels = ['A', 'B', 'C'];
            const columnLabels = ['1', '2', '3'];

            const verticalPosition = (rowIndex) => prismBaseSize / 2 - margin - buttonSize / 2 - rowIndex * (buttonSize + buttonGap);
            const horizontalPosition = (colIndex) => -prismBaseSize / 2 + margin + buttonSize / 2 + colIndex * (buttonSize + buttonGap);
            const depthPosition = (colIndex) => prismBaseSize / 2 - margin - buttonSize / 2 - colIndex * (buttonSize + buttonGap);

            rowLabels.forEach((label, rowIndex) => {
                const sprite = createTextSprite(label, { fontSize: 48 });
                sprite.userData = { type: 'grid-label' };
                const y = verticalPosition(rowIndex);

                if (faceKey === 'front' || faceKey === 'back') {
                    const x = -prismBaseSize / 2 - 0.45;
                    const z = faceKey === 'front' ? prismBaseSize / 2 + 0.01 : -prismBaseSize / 2 - 0.01;
                    sprite.position.set(x, y, z);
                    if (faceKey === 'back') {
                        sprite.material.rotation = Math.PI;
                    }
                } else {
                    const z = faceKey === 'right' ? prismBaseSize / 2 + 0.01 : -prismBaseSize / 2 - 0.01;
                    const x = faceKey === 'right' ? prismBaseSize / 2 + 0.45 : -prismBaseSize / 2 - 0.45;
                    sprite.position.set(x, y, z);
                    if (faceKey === 'left') {
                        sprite.material.rotation = Math.PI;
                    }
                }

                prismMesh.add(sprite);
                gridLabelsRef.current.push(sprite);
            });

            columnLabels.forEach((label, colIndex) => {
                const sprite = createTextSprite(label, { fontSize: 48 });
                sprite.userData = { type: 'grid-label' };

                if (faceKey === 'front' || faceKey === 'back') {
                    const x = horizontalPosition(colIndex);
                    const y = prismBaseSize / 2 + 0.5;
                    const z = faceKey === 'front' ? prismBaseSize / 2 + 0.01 : -prismBaseSize / 2 - 0.01;
                    sprite.position.set(x, y, z);
                    if (faceKey === 'back') {
                        sprite.material.rotation = Math.PI;
                    }
                } else {
                    const z = depthPosition(colIndex) * (faceKey === 'right' ? 1 : -1);
                    const y = prismBaseSize / 2 + 0.5;
                    const x = faceKey === 'right' ? prismBaseSize / 2 + 0.01 : -prismBaseSize / 2 - 0.01;
                    sprite.position.set(x, y, z);
                    if (faceKey === 'left') {
                        sprite.material.rotation = Math.PI;
                    }
                }

                prismMesh.add(sprite);
                gridLabelsRef.current.push(sprite);
            });
        };

        const createPrism = (index) => {
            const materialArray = [
                new THREE.MeshStandardMaterial({ color: faceColors.right, metalness: 0.4, roughness: 0.4 }),
                new THREE.MeshStandardMaterial({ color: faceColors.left, metalness: 0.4, roughness: 0.4 }),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.1 }),
                new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9, metalness: 0.1 }),
                new THREE.MeshStandardMaterial({ color: faceColors.front, metalness: 0.4, roughness: 0.4 }),
                new THREE.MeshStandardMaterial({ color: faceColors.back, metalness: 0.4, roughness: 0.4 })
            ];

            const geometry = new THREE.BoxGeometry(prismBaseSize, prismBaseSize, prismBaseSize);
            const prism = new THREE.Mesh(geometry, materialArray);
            prism.castShadow = true;
            prism.receiveShadow = true;
            prism.position.y = index * (prismHeight + prismSpacing) - ((prismHeight + prismSpacing) * (prismNames.length - 1)) / 2;
            prism.userData = { type: 'prism-base', index };

            FACE_KEYS.forEach((faceKey) => {
                for (let rowIndex = 0; rowIndex < GRID_SIZE; rowIndex++) {
                    for (let colIndex = 0; colIndex < GRID_SIZE; colIndex++) {
                        createButton(faceKey, index, prism, prismNames[index], rowIndex, colIndex);
                    }
                }
                createGridLabels(faceKey, prism);
            });

        const createPrism = (index) => {
            const prism = new THREE.Group();
            prism.position.y = index * (prismHeight + prismSpacing) - ((prismHeight + prismSpacing) * (PRISM_NAMES.length - 1)) / 2;
            prism.userData = { type: 'prism-base', index };
            prismGroup.current.add(prism);
            createPrismLabel(index, prismNames[index]);
        };

        prismNames.forEach((_, index) => {
            createPrism(index);
        });

        const axisGeometry = new THREE.CylinderGeometry(0.18, 0.18, prismNames.length * (prismHeight + prismSpacing) + 1.8, 32);
        const axisMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.25 });
        const axis = new THREE.Mesh(axisGeometry, axisMaterial);
        axis.position.set(0, -0.1, 0);
        prismGroup.current.add(axis);

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
            controls.current.minPolarAngle = 0.2;
            controls.current.maxPolarAngle = Math.PI - 0.2;
            controls.current.enableRotate = true;
            controls.current.enablePan = false;

            prismGroup.current.rotation.y += 0.003;

            updateLabelPositions(camera.current, prismGroup);
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
