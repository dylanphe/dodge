// HTML Canvas setup
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Ball properties
let ballX = canvasWidth / 2;
let ballY = canvasHeight / 2;
let ballZ = 0;
const ballRadius = 20;
const ballSpeed = 5;

// Small balls
const smallBalls = []; // Array to store small ball objects
const numSmallBalls = 5; // Number of small balls

// Keyboard state
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Utility function to generate a random number between min and max (inclusive)
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Small ball class
class SmallBall {
    constructor() {
        this.x = getRandomNumber(0, canvasWidth);
        this.y = getRandomNumber(0, canvasHeight);
        this.radius = 10;
        this.speedX = getRandomNumber(-3, 3);
        this.speedY = getRandomNumber(-3, 3);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off the walls
        if (this.x + this.radius >= canvasWidth || this.x - this.radius <= 0) {
            this.speedX = -this.speedX;
        }
        if (this.y + this.radius >= canvasHeight || this.y - this.radius <= 0) {
            this.speedY = -this.speedY;
        }

        // Draw small ball
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = '#FF0000'; // Red color
        context.fill();
        context.closePath();
    }
}

// Create small balls
for (let i = 0; i < numSmallBalls; i++) {
    smallBalls.push(new SmallBall());
}

// Game state
let gameOverState = false;

// Load and draw the background photo
const backgroundImage = new Image();
backgroundImage.src = 'uclalogo.png'; //
backgroundImage.onload = () => {
    context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
};

// Update function
function update() {
    if (gameOverState) {
        return; // Stop the game if it's game over
    }

    // Move the main ball based on pressed keys
    if (keys['w']) {
        ballY -= ballSpeed;
    }
    if (keys['s']) {
        ballY += ballSpeed;
    }
    if (keys['a']) {
        ballX -= ballSpeed;
    }
    if (keys['d']) {
        ballX += ballSpeed;
    }

    // Clear canvas
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the background photo
    context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

    // Draw main ball
    context.beginPath();
    const scale = 1 + ballZ * 0.01; // Scale based on ball's Z position
    context.arc(ballX, ballY, ballRadius * scale, 0, 2 * Math.PI);
    context.fillStyle = '#0000FF'; // Blue color
    context.fill();
    context.closePath();

    // Update and draw small balls
    smallBalls.forEach((smallBall) => {
        smallBall.update();

        // Check collision with small balls
        const dx = smallBall.x - ballX;
        const dy = smallBall.y - ballY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < smallBall.radius + (ballRadius * scale)) {
            gameOver();
        }
    });

    // Request next animation frame
    requestAnimationFrame(update);
}

// Game over function
function gameOver() {
    console.log('Game over!');
    gameOverState = true;
    // Add your game over logic here
    // For example, you can display a game over message on the canvas
    context.font = '30px Arial';
    context.fillStyle = '#FFFFFF'; // White color
    context.fillText('Game Over', canvasWidth / 2 - 80, canvasHeight / 2);
    context.font = '20px Arial';
    context.fillText('Press F5 to restart', canvasWidth / 2 - 90, canvasHeight / 2 + 40);
}

// Start the animation
update();
