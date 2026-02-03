const canvas = document.getElementById('cubeCanvas');
const ctx = canvas.getContext('2d');
let cubeOrientation = 'front'; // can be 'front', 'top', 'bottom', 'left', 'right', no 'back'
let moveInProgress = false;
let baseAngleX = 0, baseAngleY = 0;
let oscT = 0, oscDir = 1, oscSpeed = 0.003;

// 1. Define cube vertices (3D)
const vertices = [
    [-50, -50, -50], [50, -50, -50], [50, 50, -50], [-50, 50, -50],
    [-50, -50, 50], [50, -50, 50], [50, 50, 50], [-50, 50, 50]
];

const faceColors = [
    'rgba(255,255,255,0.15)', // back
    'rgba(255,255,255,0.20)', // front (slightly less transparent)
    'rgba(200,220,255,0.13)', // bottom (cool tint)
    'rgba(255,255,255,0.18)', // top
    'rgba(220,240,255,0.14)', // right (cool tint)
    'rgba(255,255,255,0.16)'  // left
];

// 2. Define cube edges
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

// Project 3D to 2D
function project([x, y, z]) {
    const scale = 300 / (z + 400); // Perspective
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
oscSpeed = 0.012; // Adjust for speed

// When user rotates, update baseAngleX/baseAngleY instead of angleX/angleY
function setTargetAngles(newX, newY) {
    targetAngleX = newX;
    targetAngleY = newY;
}

function drawCube() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Rotate and project vertices
    const projected = vertices.map(v => project(rotate(v, angleX, angleY)));
    // Draw edges
    ctx.strokeStyle = '#888';
    edges.forEach(([startIdx, endIdx]) => {
        const start = projected[startIdx];
        const end = projected[endIdx];
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    });

    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    edges.forEach(([a, b]) => {
        const [x1, y1] = project(rotate(vertices[a], angleX, angleY));
        const [x2, y2] = project(rotate(vertices[b], angleX, angleY));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    });

    // // Draw circles at each vertex for a rounded effect:
    // vertices.forEach((v) => {
    //     const [x, y] = project(rotate(v, angleX, angleY));
    //     ctx.beginPath();
    //     ctx.arc(x, y, 7, 0, 2 * Math.PI);
    //     ctx.fillStyle = 'black';
    //     ctx.fill();
    // });
}

function animate() {
    // Animate user-driven rotation
    if (animating) {
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
        if (Math.abs(diffY) <= 0.01 && Math.abs(diffX) <= 0.01) {
            animating = false;
            moveInProgress = false;
        }
    }

    // Banana/crescent oscillation (from 4 o'clock to 8 o'clock)
    oscT += oscSpeed * oscDir - 0.005;
    if (oscT > 1) { oscT = 1; oscDir = -1; }
    if (oscT < 0) { oscT = 0; oscDir = 1; }
    // Arc: 4 o'clock (angleA) to 8 o'clock (angleB)
    // Let's say: angleA = (Math.PI/2) + (Math.PI/6), angleB = (Math.PI/2) - (Math.PI/6)
    // We'll use these as polar angles for a banana-shaped path
    const angleA = Math.PI * 1.66; // ~8 o'clock
    const angleB = Math.PI * 1.33; // ~4 o'clock
    const oscRadius = 0.5; // ~1 degree in radians
    // Interpolate along the arc
    const oscAngle = angleA + (angleB - angleA) * oscT;
    const oscX = Math.sin(oscAngle) * oscRadius;
    const oscY = Math.cos(oscAngle) * oscRadius;

    // Combine base angles and oscillation
    angleX = baseAngleX + oscX;
    angleY = baseAngleY + oscY;

    drawCube();
    requestAnimationFrame(animate);
}

animate();