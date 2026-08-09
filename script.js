const canvas = document.getElementById("physicsCanvas");
const ctx = canvas.getContext("2d");


// ------------------------------
// Canvas setup
// ------------------------------

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ------------------------------
// Ball
// ------------------------------

const ball = {
    x: window.innerWidth / 2,
    y: -50,

    radius: 20,

    velocityY: 0,

    gravity: 0.5
};


// ------------------------------
// Animation
// ------------------------------

function update() {

    // Gravity accelerates the ball downward
    ball.velocityY += ball.gravity;

    // Move the ball
    ball.y += ball.velocityY;
}


function draw() {

    // Clear the screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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


function animate() {

    update();

    draw();

    requestAnimationFrame(animate);
}


animate();
