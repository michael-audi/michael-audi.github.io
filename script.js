const canvas = document.getElementById("physicsCanvas");
const ctx = canvas.getContext("2d");


// ------------------------------
// Canvas setup
// ------------------------------

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.70;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ------------------------------
// Ball
// ------------------------------

const ball = {
    x: canvas.width / 2,
    y: -50,

    radius: 20,

    velocityY: 0,

    gravity: 0.5
};


// ------------------------------
// Platform
// ------------------------------

function drawPlatform() {

    const platformY = canvas.height * 0.75;

    ctx.beginPath();

    ctx.moveTo(0, platformY);
    ctx.lineTo(canvas.width, platformY);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;

    ctx.stroke();
}


// ------------------------------
// Physics
// ------------------------------

function update() {

    ball.velocityY += ball.gravity;

    ball.y += ball.velocityY;
}


// ------------------------------
// Drawing
// ------------------------------

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Ball

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


    // Platform

    drawPlatform();
}


// ------------------------------
// Animation
// ------------------------------

function animate() {

    update();

    draw();

    requestAnimationFrame(animate);
}


animate();
