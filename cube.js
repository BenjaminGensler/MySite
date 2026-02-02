const canvas = document.getElementById('cubeCanvas');
const ctx = canvas.getContext('2d');
let orientation = 'front'; // can be 'front', 'top', 'bottom', 'left', 'right', no 'back'
let moveInProgress = false;

// Cube vertices
const vertices = [
    [-50, -50, -50], [50, -50, -50], [50, 50, -50], [-50, 50, -50],
    [-50, -50, 50], [50, -50, 50], [50, 50, 50], [-50, 50, 50]
];

// Cube faces (each face is 4 vertex indices)
const faces = [
    [0, 1, 2, 3], // back
    [4, 5, 6, 7], // front
    [0, 1, 5, 4], // bottom
    [2, 3, 7, 6], // top
    [1, 2, 6, 5], // right
    [0, 3, 7, 4]  // left
];

// Face colors
const faceColors = [
    'rgba(255,0,0,0.7)',    // back - red
    'rgba(0,255,0,0.7)',    // front - green
    'rgba(0,0,255,0.7)',    // bottom - blue
    'rgba(255,255,0,0.7)',  // top - yellow
    'rgba(255,0,255,0.7)',  // right - magenta
    'rgba(0,255,255,0.7)'   // left - cyan
];

// Edges for outline
const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
];

function rotate([x, y, z], angleX, angleY) {
    let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    let x1 = x * cosY + z1 * sinY;
    let z2 = -x * sinY + z1 * cosY;
    return [x1, y1, z2];
}

function project([x, y, z]) {
    const scale = 300 / (z + 400);
    return [
        x * scale + canvas.width / 2,
        y * scale + canvas.height / 2
    ];
}

let angleX = 0, angleY = 0;
let targetAngleX = angleX;
let targetAngleY = angleY;
let animating = false;

// Update your click handler:
canvas.addEventListener('click', (e) => {
    if (moveInProgress) return; // Prevent new moves during animation

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [centerX, centerY] = project(rotate([0, 0, 0], angleX, angleY));

    // Only allow move if on front face or returning to front
    if (orientation === 'front') {
        if (Math.abs(mouseX - centerX) > Math.abs(mouseY - centerY)) {
            // Left or right
            if (mouseX < centerX) {
                targetAngleY = angleY + Math.PI / 2;
                orientation = 'left';
            } else {
                targetAngleY = angleY - Math.PI / 2;
                orientation = 'right';
            }
        } else {
            // Up or down
            if (mouseY < centerY) {
                targetAngleX = angleX + Math.PI / 2;
                orientation = 'top';
            } else {
                targetAngleX = angleX - Math.PI / 2;
                orientation = 'bottom';
            }
        }
        moveInProgress = true;
        animating = true;
    } else if (
        // Only allow returning to front
        (orientation === 'left' && mouseX > centerX) ||
        (orientation === 'right' && mouseX < centerX) ||
        (orientation === 'top' && mouseY > centerY) ||
        (orientation === 'bottom' && mouseY < centerY)
    ) {
        // Return to front
        targetAngleX = 0;
        targetAngleY = 0;
        orientation = 'front';
        moveInProgress = true;
        animating = true;
    }
});

function drawCube() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Rotate and project vertices
    const rotated = vertices.map(v => rotate(v, angleX, angleY));
    const projected = rotated.map(project);

    // Draw faces (painter's algorithm: sort by average z)
    const faceDepths = faces.map(face => {
        const avgZ = face.reduce((sum, idx) => sum + rotated[idx][2], 0) / 4;
        return { face, avgZ };
    });
    faceDepths.sort((a, b) => b.avgZ - a.avgZ); // draw farthest first

    faceDepths.forEach(({ face }, i) => {
        ctx.beginPath();
        face.forEach((idx, j) => {
            const [x, y] = projected[idx];
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = faceColors[faces.indexOf(face)];
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    });

    // Draw edges for clarity
    ctx.strokeStyle = 'black';
    edges.forEach(([startIdx, endIdx]) => {
        const start = projected[startIdx];
        const end = projected[endIdx];
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    });
}

// In your animate function, after animating:
function animate() {
    if (animating) {
        const diffY = targetAngleY - angleY;
        const diffX = targetAngleX - angleX;
        if (Math.abs(diffY) > 0.01) {
            angleY += diffY * 0.2;
        } else {
            angleY = targetAngleY;
        }
        if (Math.abs(diffX) > 0.01) {
            angleX += diffX * 0.2;
        } else {
            angleX = targetAngleX;
        }
        if (Math.abs(diffY) <= 0.01 && Math.abs(diffX) <= 0.01) {
            animating = false;
            moveInProgress = false;
        }
    }
    drawCube();
    requestAnimationFrame(animate);
}

animate();

// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
// import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';


// // 1. Get the container div
// const container = document.getElementById('cube-container');
// const width = container.offsetWidth;
// const height = container.offsetHeight;

// // 2. Set up scene, camera, renderer
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.setSize(width, height);
// renderer.setClearColor(0x222222, 1);
// container.appendChild(renderer.domElement);

// // 3. Create rounded box geometry and material
// const geometry = new THREE.RoundedBoxGeometry(1, 1, 1, 8, 0.15); // width, height, depth, segments, radius
// const material = new THREE.MeshPhongMaterial({ color: 0x00aaff, opacity: 0.8, transparent: true });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// // 4. Add light
// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(5, 5, 5).normalize();
// scene.add(light);

// // 5. Position camera
// camera.position.z = 3;

// // 6. Animation loop
// function animate() {
//   requestAnimationFrame(animate);
//   cube.rotation.x += 0.01;
//   cube.rotation.y += 0.01;
//   renderer.render(scene, camera);
// }
// animate();