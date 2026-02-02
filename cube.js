const canvas = document.getElementById('cubeCanvas');
const ctx = canvas.getContext('2d');
let cubeOrientation = 'front'; // can be 'front', 'top', 'bottom', 'left', 'right', no 'back'
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
    'rgba(255,255,255,0.15)', // back
    'rgba(255,255,255,0.20)', // front (slightly less transparent)
    'rgba(200,220,255,0.13)', // bottom (cool tint)
    'rgba(255,255,255,0.18)', // top
    'rgba(220,240,255,0.14)', // right (cool tint)
    'rgba(255,255,255,0.16)'  // left
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
    if (cubeOrientation === 'front') {
        if (Math.abs(mouseX - centerX) > Math.abs(mouseY - centerY)) {
            // Left or right
            if (mouseX < centerX) {
                targetAngleY = angleY + Math.PI / 2;
                cubeOrientation = 'left';
            } else {
                targetAngleY = angleY - Math.PI / 2;
                cubeOrientation = 'right';
            }
        } else {
            // Up or down
            if (mouseY < centerY) {
                targetAngleX = angleX + Math.PI / 2;
                cubeOrientation = 'top';
            } else {
                targetAngleX = angleX - Math.PI / 2;
                cubeOrientation = 'bottom';
            }
        }
        moveInProgress = true;
        animating = true;
    } else if (
        // Only allow returning to front
        (cubeOrientation === 'left' && mouseX > centerX) ||
        (cubeOrientation === 'right' && mouseX < centerX) ||
        (cubeOrientation === 'top' && mouseY > centerY) ||
        (cubeOrientation === 'bottom' && mouseY < centerY)
    ) {
        // Return to front
        targetAngleX = 0;
        targetAngleY = 0;
        cubeOrientation = 'front';
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

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(180,220,255,0.7)'; // light blue/white for glassy edge
    edges.forEach(([a, b]) => {
        const [x1, y1] = project(rotate(vertices[a], angleX, angleY));
        const [x2, y2] = project(rotate(vertices[b], angleX, angleY));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
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

function drawHighlight() {
    // Get front face center
    const face = faces[1];
    const points = face.map(i => project(rotate(vertices[i], angleX, angleY)));
    // Calculate center
    const cx = points.reduce((sum, p) => sum + p[0], 0) / 4;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / 4;
    // Draw ellipse highlight
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 30, 12, Math.PI / 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
}

// Crescent arc from 120° (2.094 rad) to 330° (5.759 rad)
let oscAngle = 2.094; // Start at 120°
let oscDirection = 1;
const oscMin = 2.094; // 120°
const oscMax = 5.759; // 330°
const oscSpeed = 0.012; // Adjust for speed

// When user rotates, update baseAngleX/baseAngleY instead of angleX/angleY
function setTargetAngles(newX, newY) {
    targetAngleX = newX;
    targetAngleY = newY;
}

// In your animate function, after animating:
function animate() {
    time += 0.016; // ~60fps

    // Animate user-driven rotation
    const diffY = targetAngleY - baseAngleY;
    const diffX = targetAngleX - baseAngleX;
    if (Math.abs(diffY) > 0.01) {
        baseAngleY += diffY * 0.2;
    } else {
        baseAngleY = targetAngleY;
    }
    if (Math.abs(diffX) > 0.01) {
        baseAngleX += diffX * 0.2;
    } else {
        baseAngleX = targetAngleX;
    }

    // Crescent oscillation (few degrees, e.g., 0.1 rad ≈ 5.7°)
    const oscX = Math.sin(time) * 0.08; // amplitude in radians
    const oscY = Math.cos(time) * 0.05;

    angleX = baseAngleX + oscX;
    angleY = baseAngleY + oscY;
    
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