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

// The physics simulation occupies
// the right 70% of the screen.

function physicsLeft() {
    return canvas.width * 0.30;
}

function physicsWidth() {
    return canvas.width * 0.70;
}


// ==============================
// Ball
// ==============================

const ball = {
    x: physicsLeft() + physicsWidth() / 2,
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

    ctx.beginPath();

    ctx.moveTo(
        physicsLeft(),
        platformY
    );

    ctx.lineTo(
        canvas.width,
        platformY
    );

    ctx.strokeStyle = "#111";

    ctx.lineWidth = 6;

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


    // Draw the platform

    drawPlatform();


    // Draw the ball

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
