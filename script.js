const canvas = document.getElementById("physicsCanvas");
const ctx = canvas.getContext("2d");
const simShell = document.querySelector(".sim-shell");

const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const autoButton = document.getElementById("autoButton");
const ballCount = document.getElementById("ballCount");

// ============================================================
// SETTINGS
// ============================================================

const SETTINGS = {
    gravity: 980,
    wallRestitution: 0.72,
    ballRestitution: 0.82,
    platformRestitution: 0.42,
    platformFriction: 0.0005,
    floorFriction: 0.985,
    maxSpeed: 2000,
    maxBalls: 90,
    solverIterations: 2,
    fixedStep: 1 / 120,
    autoSpawnEvery: 3
};

// ============================================================
// COLORS
// ============================================================

const BALL_COLORS = [
    "#7C5CFC",
    "#2DD4BF",
    "#F8C94B",
    "#FF6B6B",
    "#38A7FF",
    "#EB5CE6",
    "#8BD450"
];

// ============================================================
// WORLD STATE
// ============================================================

let worldWidth = 1;
let worldHeight = 1;
let dpr = 1;

let balls = [];
let platforms = [];

let paused = false;
let autoSpawnEnabled = true;
let autoSpawnTimer = 0;

let lastFrameTime = performance.now();
let accumulator = 0;
let simulationVisible = true;

let scrollGravityX = 0;

// ============================================================
// POINTER
// ============================================================

const pointer = {
    active: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    hovering: false
};

// ============================================================
// HELPERS
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomColor() {
    return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
}

function magnitude(x, y) {
    return Math.hypot(x, y);
}

function dot(ax, ay, bx, by) {
    return ax * bx + ay * by;
}

// ============================================================
// BALL
// ============================================================

class Ball {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;

        this.vx = options.vx ?? 0;
        this.vy = options.vy ?? 0;

        this.radius = options.radius ?? random(7, 45);
        this.color = options.color ?? randomColor();

        this.mass = this.radius * this.radius;
        this.invMass = 1 / this.mass;
    }
}

// ============================================================
// PLATFORM
// ============================================================

class Platform {
    constructor(x1, y1, x2, y2, options = {}) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.radius = options.radius ?? 7;
        this.restitution = options.restitution ?? SETTINGS.platformRestitution;
        this.friction = options.friction ?? SETTINGS.platformFriction;

        const dx = x2 - x1;
        const dy = y2 - y1;

        this.length = Math.hypot(dx, dy) || 1;

        this.tx = dx / this.length;
        this.ty = dy / this.length;

        this.nx = -this.ty;
        this.ny = this.tx;
    }
}

// ============================================================
// RESIZE
// ============================================================

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const oldWidth = worldWidth;
    const oldHeight = worldHeight;

    worldWidth = Math.max(1, rect.width);
    worldHeight = Math.max(1, rect.height);

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(worldWidth * dpr);
    canvas.height = Math.round(worldHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (oldWidth > 1 && oldHeight > 1 && balls.length > 0) {
        const sx = worldWidth / oldWidth;
        const sy = worldHeight / oldHeight;

        for (const ball of balls) {
            ball.x *= sx;
            ball.y *= sy;
            ball.vx *= sx;
            ball.vy *= sy;
        }
    }

    buildPlatforms();
}

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(simShell);
resizeCanvas();

// ============================================================
// PLATFORMS
// ============================================================

function buildPlatforms() {
    const w = worldWidth;
    const h = worldHeight;

    const thickness = clamp(Math.min(w, h) * 0.011, 6, 10);

    platforms = [
        new Platform(
            w * 0.07,
            h * 0.15,
            w * 0.29,
            h * 0.44,
            { radius: thickness }
        ),

        new Platform(
            w * 0.29,
            h * 0.44,
            w * 0.57,
            h * 0.53,
            { radius: thickness }
        ),

        new Platform(
            w * 0.57,
            h * 0.53,
            w * 0.73,
            h * 0.53,
            {
                radius: thickness,
                restitution: 0.5
            }
        ),

        new Platform(
            w * 0.17,
            h * 0.79,
            w * 0.38,
            h * 0.71,
            {
                radius: thickness * 0.85,
                restitution: 0.52
            }
        ),

        new Platform(
            w * 0.58,
            h * 0.82,
            w * 0.84,
            h * 0.69,
            {
                radius: thickness * 0.85,
                restitution: 0.56
            }
        )
    ];
}

// ============================================================
// SPAWN
// ============================================================

function spawnBall(x, y, options = {}) {
    if (balls.length >= SETTINGS.maxBalls) {
        balls.shift();
    }

    const radius = options.radius ?? random(10, 17);

    const safeX = clamp(
        x,
        radius + 2,
        worldWidth - radius - 2
    );

    balls.push(
        new Ball(safeX, y, {
            ...options,
            radius
        })
    );
}

function spawnAutomaticBall() {
    const radius = random(10, 16);

    spawnBall(
        worldWidth * 0.09 + random(-6, 8),
        -radius - random(10, 45),
        {
            radius,
            vx: random(55, 115),
            vy: random(5, 35)
        }
    );
}

// ============================================================
// RESET
// ============================================================

function resetWorld() {
    balls = [];
    autoSpawnTimer = 0;

    for (let i = 0; i < 4; i++) {
        const radius = random(10, 16);

        spawnBall(
            worldWidth * 0.09 + random(-5, 7),
            -radius - i * 58,
            {
                radius,
                vx: random(55, 105),
                vy: random(0, 20)
            }
        );
    }
}

// ============================================================
// BALL ↔ PLATFORM
// ============================================================

function resolveBallPlatform(ball, segment) {
    const dx = ball.x - segment.x1;
    const dy = ball.y - segment.y1;

    const projected = dot(
        dx,
        dy,
        segment.tx,
        segment.ty
    );

    const along = clamp(
        projected,
        0,
        segment.length
    );

    const closestX = segment.x1 + segment.tx * along;
    const closestY = segment.y1 + segment.ty * along;

    const offsetX = ball.x - closestX;
    const offsetY = ball.y - closestY;

    const minDistance = ball.radius + segment.radius;

    const distanceSquared =
        offsetX * offsetX +
        offsetY * offsetY;

    if (distanceSquared >= minDistance * minDistance) {
        return;
    }

    let distance = Math.sqrt(distanceSquared);

    let nx;
    let ny;

    if (distance > 0.0001) {
        nx = offsetX / distance;
        ny = offsetY / distance;
    } else {
        nx = segment.nx;
        ny = segment.ny;

        if (dot(ball.vx, ball.vy, nx, ny) > 0) {
            nx *= -1;
            ny *= -1;
        }

        distance = 0;
    }

    const penetration = minDistance - distance;

    ball.x += nx * (penetration + 0.02);
    ball.y += ny * (penetration + 0.02);

    const velocityAlongNormal = dot(
        ball.vx,
        ball.vy,
        nx,
        ny
    );

    if (velocityAlongNormal < 0) {
        const restitution =
            Math.abs(velocityAlongNormal) < 55
                ? 0
                : segment.restitution;

        const impulseScale =
            (1 + restitution) *
            velocityAlongNormal;

        ball.vx -= impulseScale * nx;
        ball.vy -= impulseScale * ny;

        const tx = -ny;
        const ty = nx;

        const tangentialSpeed = dot(
            ball.vx,
            ball.vy,
            tx,
            ty
        );

        ball.vx -= tangentialSpeed * tx * segment.friction;
        ball.vy -= tangentialSpeed * ty * segment.friction;
    }
}

// ============================================================
// BALL ↔ BALL
// ============================================================

function resolveBallBall(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const minDistance = a.radius + b.radius;

    const distanceSquared =
        dx * dx +
        dy * dy;

    if (distanceSquared >= minDistance * minDistance) {
        return;
    }

    let distance = Math.sqrt(distanceSquared);

    let nx;
    let ny;

    if (distance > 0.0001) {
        nx = dx / distance;
        ny = dy / distance;
    } else {
        nx = 1;
        ny = 0;
        distance = 0;
    }

    const penetration = minDistance - distance;
    const invMassSum = a.invMass + b.invMass;

    const correction =
        Math.max(penetration - 0.01, 0) * 0.82;

    a.x -= nx * correction * (a.invMass / invMassSum);
    a.y -= ny * correction * (a.invMass / invMassSum);

    b.x += nx * correction * (b.invMass / invMassSum);
    b.y += ny * correction * (b.invMass / invMassSum);

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;

    const velocityAlongNormal = dot(
        rvx,
        rvy,
        nx,
        ny
    );

    if (velocityAlongNormal > 0) {
        return;
    }

    const impulseMagnitude =
        -(1 + SETTINGS.ballRestitution) *
        velocityAlongNormal /
        invMassSum;

    const impulseX = impulseMagnitude * nx;
    const impulseY = impulseMagnitude * ny;

    a.vx -= impulseX * a.invMass;
    a.vy -= impulseY * a.invMass;

    b.vx += impulseX * b.invMass;
    b.vy += impulseY * b.invMass;
}

// ============================================================
// WALLS
// ============================================================

function resolveWalls(ball) {
    const e = SETTINGS.wallRestitution;

    // Left wall
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;

        if (ball.vx < 0) {
            ball.vx = -ball.vx * e;
        }
    }

    // Right wall
    if (ball.x + ball.radius > worldWidth) {
        ball.x = worldWidth - ball.radius;

        if (ball.vx > 0) {
            ball.vx = -ball.vx * e;
        }
    }

    // Floor
    if (ball.y + ball.radius > worldHeight) {
        ball.y = worldHeight - ball.radius;

        if (ball.vy > 0) {
            if (Math.abs(ball.vy) < 60) {
                ball.vy = 0;
            } else {
                ball.vy = -ball.vy * e;
            }
        }

        ball.vx *= SETTINGS.floorFriction;
    }
}

// ============================================================
// PHYSICS STEP
// ============================================================

function physicsStep(dt) {
    for (const ball of balls) {
        // Downward gravity
        ball.vy += SETTINGS.gravity * dt;

        // Scroll-generated sideways gravity
        ball.vx += scrollGravityX * dt;

        const damping = Math.pow(0.9994, dt * 60);

        ball.vx *= damping;
        ball.vy *= damping;

        const speed = magnitude(ball.vx, ball.vy);

        if (speed > SETTINGS.maxSpeed) {
            const scale = SETTINGS.maxSpeed / speed;

            ball.vx *= scale;
            ball.vy *= scale;
        }

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
    }

    for (
        let iteration = 0;
        iteration < SETTINGS.solverIterations;
        iteration++
    ) {
        for (const ball of balls) {
            for (const platform of platforms) {
                resolveBallPlatform(ball, platform);
            }

            resolveWalls(ball);
        }

        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                resolveBallBall(balls[i], balls[j]);
            }
        }
    }
}

// ============================================================
// DRAWING
// ============================================================

function drawPlatforms() {
    ctx.save();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#3B82F6";
    ctx.shadowColor = "rgba(59, 130, 246, 0.32)";
    ctx.shadowBlur = 16;

    for (const segment of platforms) {
        ctx.beginPath();

        ctx.moveTo(
            segment.x1,
            segment.y1
        );

        ctx.lineTo(
            segment.x2,
            segment.y2
        );

        ctx.lineWidth = segment.radius * 2;
        ctx.stroke();
    }

    ctx.restore();
}

function drawBalls() {
    for (const ball of balls) {
        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = ball.color;
        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            ball.x - ball.radius * 0.28,
            ball.y - ball.radius * 0.30,
            ball.radius * 0.18,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fill();
    }
}

function drawPointerPreview() {
    if (!pointer.hovering && !pointer.active) {
        return;
    }

    ctx.save();

    if (pointer.active) {
        const dx = pointer.x - pointer.startX;
        const dy = pointer.y - pointer.startY;

        const dragDistance = Math.hypot(dx, dy);

        ctx.setLineDash([6, 7]);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";

        ctx.beginPath();

        ctx.moveTo(
            pointer.startX,
            pointer.startY
        );

        ctx.lineTo(
            pointer.x,
            pointer.y
        );

        ctx.stroke();

        ctx.setLineDash([]);

        ctx.beginPath();

        ctx.arc(
            pointer.startX,
            pointer.startY,
            13,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            dragDistance > 12
                ? "rgba(96,165,250,0.95)"
                : "rgba(255,255,255,0.7)";

        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        ctx.beginPath();

        ctx.arc(
            pointer.x,
            pointer.y,
            11,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 1;

        ctx.stroke();
    }

    ctx.restore();
}

function render() {
    ctx.clearRect(
        0,
        0,
        worldWidth,
        worldHeight
    );

    drawPlatforms();
    drawBalls();
    drawPointerPreview();

    ballCount.textContent =
        `${balls.length} ball${balls.length === 1 ? "" : "s"}`;
}

// ============================================================
// MAIN LOOP
// ============================================================

function frame(now) {
    let frameTime =
        (now - lastFrameTime) / 1000;

    lastFrameTime = now;

    frameTime = Math.min(
        frameTime,
        0.05
    );

    if (simulationVisible && !paused) {
        accumulator += frameTime;
        autoSpawnTimer += frameTime;

        if (
            autoSpawnEnabled &&
            autoSpawnTimer >= SETTINGS.autoSpawnEvery
        ) {
            autoSpawnTimer %= SETTINGS.autoSpawnEvery;

            if (balls.length < 48) {
                spawnAutomaticBall();
            }
        }

        let steps = 0;

        while (
            accumulator >= SETTINGS.fixedStep &&
            steps < 8
        ) {
            physicsStep(SETTINGS.fixedStep);

            accumulator -= SETTINGS.fixedStep;
            steps++;
        }

        if (steps === 8) {
            accumulator = 0;
        }
    }

    if (simulationVisible) {
        render();
    }

    requestAnimationFrame(frame);
}

// ============================================================
// POINTER
// ============================================================

function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

canvas.addEventListener("pointerenter", event => {
    const p = pointerPosition(event);

    pointer.hovering = true;
    pointer.x = p.x;
    pointer.y = p.y;
});

canvas.addEventListener("pointermove", event => {
    const p = pointerPosition(event);

    pointer.x = p.x;
    pointer.y = p.y;
});

canvas.addEventListener("pointerleave", () => {
    if (!pointer.active) {
        pointer.hovering = false;
    }
});

canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0) {
        return;
    }

    const p = pointerPosition(event);

    pointer.active = true;
    pointer.hovering = true;

    pointer.startX = p.x;
    pointer.startY = p.y;

    pointer.x = p.x;
    pointer.y = p.y;

    canvas.setPointerCapture(
        event.pointerId
    );
});

canvas.addEventListener("pointerup", event => {
    if (!pointer.active) {
        return;
    }

    const p = pointerPosition(event);

    pointer.x = p.x;
    pointer.y = p.y;

    const dx =
        pointer.x -
        pointer.startX;

    const dy =
        pointer.y -
        pointer.startY;

    const dragDistance =
        Math.hypot(dx, dy);

    if (dragDistance > 12) {
        const launchScale = 3.25;

        let vx = dx * launchScale;
        let vy = dy * launchScale;

        const speed =
            magnitude(vx, vy);

        if (speed > SETTINGS.maxSpeed) {
            const scale =
                SETTINGS.maxSpeed /
                speed;

            vx *= scale;
            vy *= scale;
        }

        spawnBall(
            pointer.startX,
            pointer.startY,
            {
                vx,
                vy
            }
        );
    } else {
        spawnBall(
            pointer.startX,
            pointer.startY,
            {
                vx: random(-25, 25),
                vy: 0
            }
        );
    }

    pointer.active = false;

    if (
        canvas.hasPointerCapture(
            event.pointerId
        )
    ) {
        canvas.releasePointerCapture(
            event.pointerId
        );
    }
});

canvas.addEventListener("pointercancel", () => {
    pointer.active = false;
});

// ============================================================
// BUTTONS
// ============================================================

function updatePauseButton() {
    pauseButton.textContent =
        paused ? "Play" : "Pause";

    pauseButton.setAttribute(
        "aria-pressed",
        String(paused)
    );
}

pauseButton.addEventListener("click", () => {
    paused = !paused;
    accumulator = 0;

    updatePauseButton();
});

resetButton.addEventListener(
    "click",
    resetWorld
);

function updateAutoButton() {
    autoButton.textContent =
        autoSpawnEnabled
            ? "Auto on"
            : "Auto off";

    autoButton.setAttribute(
        "aria-pressed",
        String(autoSpawnEnabled)
    );
}

autoButton.addEventListener("click", () => {
    autoSpawnEnabled =
        !autoSpawnEnabled;

    autoSpawnTimer = 0;

    updateAutoButton();
});

// ============================================================
// KEYBOARD
// ============================================================

window.addEventListener("keydown", event => {
    const tag =
        document.activeElement?.tagName;

    if (
        tag === "INPUT" ||
        tag === "TEXTAREA"
    ) {
        return;
    }

    if (event.code === "Space") {
        event.preventDefault();

        paused = !paused;
        accumulator = 0;

        updatePauseButton();
    }

    if (
        event.key.toLowerCase() === "r"
    ) {
        resetWorld();
    }
});

// ============================================================
// PAGE VISIBILITY
// ============================================================

document.addEventListener("visibilitychange", () => {
    lastFrameTime = performance.now();
    accumulator = 0;
});

// ============================================================
// SIMULATION VISIBILITY
// ============================================================

const simulationObserver =
    new IntersectionObserver(
        entries => {
            simulationVisible =
                entries[0].isIntersecting;

            lastFrameTime =
                performance.now();

            accumulator = 0;
        },
        {
            threshold: 0
        }
    );

simulationObserver.observe(simShell);

// ============================================================
// PROJECT / SECTION REVEALS
// ============================================================

const revealElements =
    document.querySelectorAll(".reveal");

const revealObserver =
    new IntersectionObserver(
        entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target
                        .classList
                        .add("visible");

                    revealObserver.unobserve(
                        entry.target
                    );
                }
            }
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

for (const element of revealElements) {
    revealObserver.observe(element);
}

// ============================================================
// SCROLL-DRIVEN HERO
// ============================================================

const heroScroll =
    document.querySelector(".hero-scroll");

let scrollAnimationQueued = false;

function updateHeroScroll() {
    scrollAnimationQueued = false;

    const rect =
        heroScroll.getBoundingClientRect();

    const travel =
        heroScroll.offsetHeight -
        window.innerHeight;

    const progress =
        travel > 0
            ? clamp(
                -rect.top / travel,
                0,
                1
            )
            : 0;

    // Michael Audi fades out
    const introOut =
        clamp(
            progress / 0.28,
            0,
            1
        );

    heroScroll.style.setProperty(
        "--intro-opacity",
        String(1 - introOut)
    );

    heroScroll.style.setProperty(
        "--intro-y",
        `${-30 * introOut}px`
    );

    // Second hero message fades in
    const projectsIn =
        clamp(
            (progress - 0.36) / 0.34,
            0,
            1
        );

    heroScroll.style.setProperty(
        "--next-opacity",
        String(projectsIn)
    );

    heroScroll.style.setProperty(
        "--next-y",
        `${34 * (1 - projectsIn)}px`
    );

    // Bottom CTA fades out
    const noteOut =
        clamp(
            progress / 0.18,
            0,
            1
        );

    heroScroll.style.setProperty(
        "--scroll-note-opacity",
        String(1 - noteOut)
    );

    // Physics tilts sideways while scrolling
    scrollGravityX =
        230 *
        Math.sin(
            progress * Math.PI
        );
}

function queueHeroScrollUpdate() {
    if (scrollAnimationQueued) {
        return;
    }

    scrollAnimationQueued = true;

    requestAnimationFrame(
        updateHeroScroll
    );
}

window.addEventListener(
    "scroll",
    queueHeroScrollUpdate,
    {
        passive: true
    }
);

window.addEventListener(
    "resize",
    queueHeroScrollUpdate
);

updateHeroScroll();

// ============================================================
// START
// ============================================================

updatePauseButton();
updateAutoButton();
resetWorld();

requestAnimationFrame(frame);