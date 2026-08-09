const canvas = document.getElementById("physicsCanvas");
const ctx = canvas.getContext("2d");


// ==============================
// Canvas
// ==============================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ==============================
// Physics area
// ==============================

const PHYSICS_START = 0.30;


// ==============================
// Ball
// ==============================

const ball = {
    x: canvas.width * 0.65,
    y: -50,

    radius: 20,

    velocityY: 0,
    gravity: 0.5
};


// ==============================
// Platform
// ==============================

function drawPlatform() {

    const platformY = canvas.height * 0.75;
    const startX = canvas.width * PHYSICS_START;

    ctx.beginPath();

    ctx.moveTo(startX, platformY);
    ctx.lineTo(canvas.width, platformY);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 8;

    ctx.stroke();
}


// ==============================
// Physics
// ==============================

function update() {

    ball.velocityY += ball.gravity;

    ball.y += ball.velocityY;
}


// ==============================
// Drawing
// ==============================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Draw physics boundary
    ctx.beginPath();

    ctx.moveTo(
        canvas.width * PHYSICS_START,
        0
    );

    ctx.lineTo(
        canvas.width * PHYSICS_START,
        canvas.height
    );

    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 2;

    ctx.stroke();


    // Draw platform
    drawPlatform();


    // Draw ball
    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#111";

    ctx.fill();
}


// ==============================
// Animation
// ==============================

function animate() {

    update();

    draw();

    requestAnimationFrame(animate);
}

animate();
