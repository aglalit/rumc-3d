import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';

const ThreeScene = () => {
    const mountRef = useRef(null);
    const [selectedSector, setSelectedSector] = useState(null);

    // Используем useRef для хранения объектов Three.js
    const scene = useRef(null);
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const prismGroup = useRef(null);
    const raycaster = useRef(null);
    const animationId = useRef(null);
    const labelsRef = useRef([]);
    const prismNames = ['Самопроектирование', 'Индивидуализация', 'Интеграция', 'Адаптация'];

    const sectorData = {
        'prism0_face0': { title: 'Архитектурная доступность', description: 'Создание безбарьерной среды: пандусы, лифты, широкие дверные проемы, тактильная навигация.' },
        'prism0_face1': { title: 'Технологическая инфраструктура', description: 'Оснащение современным оборудованием: интерактивные панели, системы видеоконференцсвязи.' },
        'prism0_face2': { title: 'Учебные материалы', description: 'Разработка материалов в multiple форматах: аудио, видео, тексты с возможностью изменения шрифта.' },

        'prism1_face0': { title: 'Цифровая доступность', description: 'Веб-сайты и платформы, соответствующие стандартам WCAG: читаемость, навигация с клавиатуры.' },
        'prism1_face1': { title: 'Гибкость обучения', description: 'Разнообразие форматов обучения: очное, онлайн, гибридное, индивидуальные образовательные траектории.' },
        'prism1_face2': { title: 'Оценивание', description: 'Многофакторная система оценки: проекты, портфолио, практические задания, адаптивные тесты.' },

        'prism2_face0': { title: 'Подготовка преподавателей', description: 'Программы повышения квалификации по инклюзивному образованию и универсальному дизайну.' },
        'prism2_face1': { title: 'Студенческое сообщество', description: 'Программы менторства, peer-to-peer поддержка, инклюзивные студенческие клубы.' },
        'prism2_face2': { title: 'Психологическая поддержка', description: 'Консультационные услуги, программы mental health поддержки, антибуллинговые политики.' },

        'prism3_face0': { title: 'Политики и регламенты', description: 'Разработка нормативной базы, обеспечивающей равные возможности и защиту от дискриминации.' },
        'prism3_face1': { title: 'Финансирование', description: 'Бюджетирование инклюзивных инициатив, grant программы, партнерства с организациями.' },
        'prism3_face2': { title: 'Мониторинг и оценка', description: 'Система сбора feedback, регулярные аудиты доступности, KPI инклюзивности.' }
    };

    useEffect(() => {
        // Инициализация сцены
        scene.current = new THREE.Scene();
        scene.current.background = new THREE.Color(0xf8f9fa);

        // Инициализация камеры
        camera.current = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.current.position.z = 12;

        // Инициализация рендерера
        renderer.current = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.current.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        );
        renderer.current.setPixelRatio(window.devicePixelRatio);

        // Очищаем контейнер и добавляем рендерер
        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }
        mountRef.current.appendChild(renderer.current.domElement);

        // Инициализация OrbitControls
        controls.current = new OrbitControls(
            camera.current,
            renderer.current.domElement
        );
        controls.current.enableDamping = true;
        controls.current.dampingFactor = 0.05;

        // Освещение
        const ambientLight = new THREE.AmbientLight(0x404040, 16.9);
        scene.current.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        scene.current.add(directionalLight);

        // Создаем группу для призм
        prismGroup.current = new THREE.Group();
        scene.current.add(prismGroup.current);

        // Создаем призмы
        const colors = [0x3498db, 0x2ecc71, 0xe74c3c, 0xf39c12];

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

        // Функция для обновления позиций подписей
        const updateLabelPositions = (camera, prismGroup) => {
            if (!prismGroup.current) return;
            prismGroup.current.children.forEach((prism, index) => {
                const label = labelsRef.current[index];
                if (!label) return;

                // Получаем мировую позицию призмы
                const worldPosition = new THREE.Vector3();
                prism.getWorldPosition(worldPosition);
                // Проецируем 3D позицию в 2D экранные координаты
                const vector = worldPosition.project(camera);

                // Преобразуем нормализованные координаты в пиксели
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth - 200;
                const y = (-vector.y * 0.5 + 0.5) * window.innerHeight - 100;

                // Устанавливаем позицию подписи
                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
            });
        };

        for (let i = 0; i < 4; i++) {
            const geometry = new THREE.CylinderGeometry(1, 1, 1.5, 3);
            const material = new THREE.MeshPhongMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.9,
                shininess: 100
            });

            const prism = new THREE.Mesh(geometry, material);
            prism.position.y = i * 2.5 - 3.75;
            // prism.rotation.x = Math.PI / 2;
            prism.userData = {
                type: 'prism',
                index: i,
                hoverable: true
            };

            // Добавляем wireframe
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({
                    color: 0x000000,
                    linewidth: 2
                })
            );
            prism.add(line);

            prismGroup.current.add(prism);
            createPrismLabel(i, prismNames[i]);
        }

        // Инициализация Raycaster
        raycaster.current = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Обработчик ресайза
        const handleResize = () => {
            if (!mountRef.current) return;

            camera.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(
                mountRef.current.clientWidth,
                mountRef.current.clientHeight
            );
            updateLabelPositions(camera.current, prismGroup);
        };

        window.addEventListener('resize', handleResize);

        // Обработчик кликов
        const handleClick = (event) => {
            const rect = renderer.current.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.current.setFromCamera(mouse, camera.current);
            const intersects = raycaster.current.intersectObjects(prismGroup.current.children, false);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.hoverable) {
                    const faceIndex = Math.floor(Math.random() * 3);
                    const sectorKey = `prism${object.userData.index}_face${faceIndex}`;

                    if (sectorData[sectorKey]) {
                        setSelectedSector({
                            id: sectorKey,
                            ...sectorData[sectorKey]
                        });
                    }
                }
            }
        };

        renderer.current.domElement.addEventListener('click', handleClick);
        renderer.current.domElement.style.cursor = 'pointer';

        // Анимация
        const animate = () => {
            animationId.current = requestAnimationFrame(animate);

            // Обновляем контролы
            controls.current.update();
            controls.current.minPolarAngle = Math.PI/2; // Lock to the horizontal plane
            controls.current.maxPolarAngle = Math.PI/2;
            controls.current.enableRotate = true;         // Разрешаем вращение
            controls.current.enablePan = false;           // Отключаем панорамирование
            // controls.current.object.rotation.x = 0;    // Запрещаем вращение по X
            // controls.current.object.rotation.z = 0;    // Запрещаем вращение по Z
            // Вращаем группу призм
            prismGroup.current.rotation.y += 0.005;

            renderer.current.render(scene.current, camera.current);
        };

        animate();

        // Очистка
        return () => {
            window.removeEventListener('resize', handleResize);

            if (renderer.current) {
                renderer.current.domElement.removeEventListener('click', handleClick);

                if (animationId.current) {
                    cancelAnimationFrame(animationId.current);
                }

                // Удаляем canvas
                if (renderer.current.domElement.parentNode === mountRef.current) {
                    mountRef.current.removeChild(renderer.current.domElement);
                }

                // Удаляем подписи
                labelsRef.current.forEach(label => {
                    if (label && label.parentNode) {
                        label.parentNode.removeChild(label);
                    }
                });
                labelsRef.current = [];

                // Освобождаем ресурсы
                renderer.current.dispose();

                if (controls.current) {
                    controls.current.dispose();
                }

                // Очищаем геометрию и материалы
                scene.current.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
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
                    <p>🖱️ Перетаскивайте мышью для вращения модели</p>
                    <p>🔍 Колесико мыши для приближения/отдаления</p>
                </div>

                <div
                    ref={mountRef}
                    className="canvas-container"
                />
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