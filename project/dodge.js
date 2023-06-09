import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Textured_Phong} = defs

export class Dodge extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.startTime = null;
        this.endTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere4: new defs.Subdivision_Sphere(4),
            cube: new defs.Cube(),
            land: new defs.Square(),
            brick: new defs.Cube(),
            square: new defs.Square(),
        };

        // Change texture mapping
        this.shapes.land.arrays.texture_coord = this.shapes.land.arrays.texture_coord.map(vec2 => [vec2[0] * 10, vec2[1]]);
        this.shapes.brick.arrays.texture_coord = this.shapes.brick.arrays.texture_coord.map(vec2 => [vec2[0], vec2[1]*10]);
        this.shapes.sphere4.arrays.texture_coord = this.shapes.sphere4.arrays.texture_coord.map(vec2 => [vec2[0], vec2[1]]);

        // *** Materials
        this.materials = {
            player: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 1, specularity: .2,
                color: hex_color("#000000"),
                texture: new Texture("assets/ball.jpg"),
            }),
            explosiveSquare: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 1, specularity: .2,
                color: hex_color("#000000"),
                texture: new Texture("assets/tnt.png"),
            }),
            smallSquare: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#FF0000")}),
            land: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/land.jpg"),
            }),
            sky: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/sky.png"),
            }),
            brick: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/brick.png", "NEAREST"),
            }),
            cloud: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/cloud.png", "LINEAR_MIPMAP_LINEAR"),
            }),
            gameover: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/gv.png"),
            }),
            gamestart: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/gs.png"),
            }),
            explosion: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                color: hex_color("#000000"),
                texture: new Texture("assets/explosion.png"),
            }),

        }

        // Fixed Camera location
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 50), vec3(0, 0, 0), vec3(0, 1, 0));

        // Game States:
        this.endTime = performance.now();
        clearInterval(this.timerInterval);
        this.gameOver = true;
        this.start = true;

        // Player: Location and Interactivities
        this.score = 0;
        this.player_location = Mat4.identity();
        this.target_location = Mat4.identity();
        this.leftPressed = false;
        this.rightPressed = false;
        this.upPressed = false;
        this.downPressed = false;
        //this.frontPressed = false;

        // Verticle Single Rec: Location
        this.vleftRec_positions = [];
        this.vrightRec_positions = [];
        this.vleftRec_num = 0;
        this.vrightRec_num = 0;

        // Small Squares: Location and Velocities
        this.smallSquare_positions = [];
        this.smallSquare_velocities = [];
        this.smallSquare_num = 0;

        // Explosive Squares: Location and Velocities
        this.explosiveSquare_positions = [];
        this.explosiveSquare_velocities = [];
        this.explosiveSquare_num = 0;
    }

    // Function to control game interactivities
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Move Left", ["ArrowLeft"], () => {this.leftPressed = true;});
        this.key_triggered_button("Move Right", ["ArrowRight"], () => {this.rightPressed = true;});
        this.new_line();
        this.key_triggered_button("Move Up", ["ArrowUp"], () => {this.upPressed = true;});
        this.key_triggered_button("Move Down", ["ArrowDown"], () => {this.downPressed = true;});
        //this.key_triggered_button("Move Front", ["Backspace"], () => {this.frontPressed = true;}); for demo
        this.new_line();
        this.new_line();
        this.key_triggered_button("Start", ["Enter"], () => {this.startGame();});
    }

    // Function to update time when game is over
    updateElapsedTime() {
        this.elapsedTime = performance.now() - this.startTime;
    }
    formatTime(time) {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = Math.floor((time % 1000) / 10);

        return (
            minutes.toString().padStart(2, "0") +
            ":" +
            seconds.toString().padStart(2, "0") +
            "." +
            milliseconds.toString().padStart(2, "0")
        );
    }

    // Function to update game state when game is reset or over
    startGame() {
        // Reset game state
        if (this.gameOver == true) {
            this.startTime = performance.now();
            this.timerInterval = setInterval(() => {
                this.updateElapsedTime();
            }, 10);
            this.gameOver = false;
            this.score = 0;
            this.player_location = Mat4.identity();
            this.target_location = Mat4.identity();
            this.leftPressed = false;
            this.rightPressed = false;
            this.upPressed = false;
            this.downPressed = false;
            //this.frontPressed = false;
            this.smallSquare_positions = [];
            this.smallSquare_velocities = [];
            this.smallSquare_num = 0;
            this.explosiveSquare_positions = [];
            this.explosiveSquare_velocities = [];
            this.explosiveSquare_num = 0;
            this.vleftRec_positions = [];
            this.vleftRec_target = [];
            this.vleftRec_num = 0;
            this.vrightRec_positions = [];
            this.vrightRec_target = [];
            this.vrightRec_num = 0;
            this.start = false;
        }
    }
    endGame() {
        // Other game over logic

        // Stop the stopwatch
        this.endTime = performance.now();
        const timePlayed = (this.endTime - this.startTime) / 1000; // Convert to seconds

        // Display the time played in the modal
        const timePlayedElement = document.getElementById("time-played");
        timePlayedElement.textContent = timePlayed.toFixed(2); // Display up to 2 decimal places
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        // The parameters of the Light are: position, color, size
        const light_position = vec4(0, 5, 0, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 0.8, 0.2, 1), 1000)];

        // Update the final score text
        const finalScore = document.getElementById("final-score");
        finalScore.textContent = this.score;
        // Update the final score text
        if (this.gameOver) {
            // Game over logic here, such as displaying a game over message or score
            const modal = document.getElementById("game-over-modal");
            const timePlayedElement = document.getElementById("time-played");


            // Calculate the time played
            const timePlayed = this.elapsedTime;

            // Display the formatted time played in the modal
            timePlayedElement.textContent = this.formatTime(timePlayed);

            // Show the game over modal
            modal.style.display = "block";

            // Play again button event listener
            const playAgainButton = document.getElementById("play-again-button");
            playAgainButton.addEventListener("click", () => {
                // Reset the game and hide the game over modal
                this.startGame();
                this.start = false;
                modal.style.display = "none";
            });

            // Draw background
            var land_transform = Mat4.identity().times(Mat4.translation(0, -25,-20))
            .times(Mat4.scale(52.5, 4, 1));
            this.shapes.land.draw(
                context,
                program_state,
                land_transform,
                this.materials.land
            );

            var sky_transform = Mat4.identity().times(Mat4.translation(0, 4,-20))
                    .times(Mat4.scale(52.5, 25, 1));
            this.shapes.square.draw(
                context,
                program_state,
                sky_transform,
                this.materials.sky
            );

            // Calculate the x position based on time
            //const x_position = (t % 10) / 10; // Range from 0 to 1 over 8 seconds
            const x_position = Math.sin(t * Math.PI);

            // Create the plane_transform matrix
            const cloud1_transform = Mat4.identity()
            .times(Mat4.translation(29 - x_position * 1, 20, -10))
            .times(Mat4.scale(7, 7, 1));

            // Create the plane_transform matrix
            const cloud2_transform = Mat4.identity()
            .times(Mat4.translation(-28 - x_position * 1, 18, -10))
            .times(Mat4.scale(7, 7, 1))
            .times(Mat4.scale(-1, 1, 1));

            this.shapes.square.draw(
                context,
                program_state,
                cloud1_transform,
                this.materials.cloud
            );

            this.shapes.square.draw(
                context,
                program_state,
                cloud2_transform,
                this.materials.cloud
            );

            var gameover_transform = Mat4.identity().times(Mat4.translation(0, 0,-10))
                                                        .times(Mat4.scale(25, 25, 1));
            
            if (this.start == false ) {
                this.shapes.square.draw(
                    context,
                    program_state,
                    gameover_transform,
                    this.materials.gameover
                );
            } else {
                this.shapes.square.draw(
                    context,
                    program_state,
                    gameover_transform,
                    this.materials.gamestart
                );
            }
            
            // Stop the stopwatch
            clearInterval(this.timerInterval);

            return;
        }

        // screen size
        const xMin = -36.5;
        const xMax = 36.5;
        const yMin = -20;
        const yMax = 20;

        if (this.gameOver == false) {
            // TODO: ADD MORE TRANFORMATION EFFECTS TO EACH OBJECT (ROTATION and SUCH)
            // Interactivities functions
            if (this.leftPressed) {
                if (this.target_location[0][3]-0.5 > xMin) {
                    this.target_location = this.target_location.times(Mat4.translation(-2.00,0,0));
                }
                this.leftPressed = false;
            } if (this.rightPressed) {
                if (this.target_location[0][3]+0.5 < xMax) {
                    this.target_location = this.target_location.times(Mat4.translation(2.00,0,0));
                }
                this.rightPressed = false;
            } if (this.upPressed) {
                if (this.target_location[1][3]+0.5 < yMax) {
                    this.target_location = this.target_location.times(Mat4.translation(0,2.00,0));
                }
                this.upPressed = false;
            } if (this.downPressed) {
                if (this.target_location[1][3]-0.5 > yMin) {
                    this.target_location = this.target_location.times(Mat4.translation(0,-2.00,0));
                }
                this.downPressed = false;
            } 
            /*if (this.frontPressed) {
                this.target_location = this.target_location.times(Mat4.translation(0,0,2));
                this.frontPressed = false;
            }*/

            // Smoothing out player's movement
            const blending_factor = 0.25;
            this.player_location = this.player_location.map((x, i) =>
                Vector.from(x).mix(Vector.from(this.target_location[i]), blending_factor)
            );

            // Drawing Player
            const player_transform = this.player_location.times(Mat4.scale(0.60, 0.60, 0.60));
            this.shapes.sphere4.draw(
                context,
                program_state,
                player_transform,
                this.materials.player
            );

            // Draw background
            var land_transform = Mat4.identity().times(Mat4.translation(0, -25,-20))
            .times(Mat4.scale(52.5, 4, 1));
            this.shapes.land.draw(
            context,
            program_state,
            land_transform,
            this.materials.land
            );
            var sky_transform = Mat4.identity().times(Mat4.translation(0, 4,-20))
            .times(Mat4.scale(52.5, 25, 1));
            this.shapes.square.draw(
            context,
            program_state,
            sky_transform,
            this.materials.sky
            );
            // Clouds
            const x_position = Math.sin(t * Math.PI);
            // Create the cloud1_transform matrix
            const cloud1_transform = Mat4.identity()
            .times(Mat4.translation(29 - x_position * 1, 20, -10))
            .times(Mat4.scale(7, 7, 1));
            // Create the cloud2_transform matrix
            const cloud2_transform = Mat4.identity()
            .times(Mat4.translation(-28 - x_position * 1, 18, -10))
            .times(Mat4.scale(7, 7, 1))
            .times(Mat4.scale(-1, 1, 1));
            this.shapes.square.draw(
            context,
            program_state,
            cloud1_transform,
            this.materials.cloud
            );
            this.shapes.square.draw(
            context,
            program_state,
            cloud2_transform,
            this.materials.cloud
            );

            
            // vRec Implementation
            let recInterval = 15;
            const rec_maxCnt = 1;
            let recSpeed = 0.1;
            let rec_t = t%recInterval;
            let randSpawn = Math.floor(Math.random() * 2);

            if (this.score >= 30) {
                recInterval = 10;
            }

            // vleftRec Spawning behaviors
            if (rec_t >= (recInterval-0.019) && this.vleftRec_num < rec_maxCnt && randSpawn == 0 && this.score >= 6) {
                if (this.vrightRec_num == 0) {
                    this.vleftRec_positions.push(Mat4.identity().times(Mat4.translation(-34,0,0))); // Initial position
                    this.vleftRec_num += 1;
                }
            }

            // vrightRec Spawning behaviors
            if (rec_t >= (recInterval-0.019) && this.vrightRec_num < rec_maxCnt && randSpawn == 1 && this.score >= 10) {
                if (this.vleftRec_num == 0) {
                    this.vrightRec_positions.push(Mat4.identity().times(Mat4.translation(34,0,0))); // Initial position
                    this.vrightRec_num += 1;
                }
            }

            // Collision Detection for Player with vleftRec
            for (let j = 0; j < this.vleftRec_positions.length; j++) {
                let vleftRecX = this.vleftRec_positions[j][0][3];  // X-coordinate of vleftRec center
                let vleftRecY = this.vleftRec_positions[j][1][3];  // Y-coordinate of vleftRec center
                // Calculate the leftmost and rightmost positions of the single rectangle
                let vleftRecLeft = vleftRecX - 1.4;
                let vleftRecRight = vleftRecX + 1.4;
                // Calculate the topmost and bottommost positions of the single rectangle
                const vleftRecTop = vleftRecY - 12;
                const vleftRecBottom = vleftRecY + 12;
                if (this.player_location[0][3] < vleftRecRight && this.player_location[0][3] > vleftRecLeft && this.player_location[1][3] >= vleftRecTop &&
                    this.player_location[1][3] <= vleftRecBottom)
                {
                    this.gameOver = true;
                    this.start = false;                     
                }
            }

            // Collision Detection for Player with vrightRec
            for (let j = 0; j < this.vrightRec_positions.length; j++) {
                let vrightRecX = this.vrightRec_positions[j][0][3];  // X-coordinate of vleftRec center
                let vrightRecY = this.vrightRec_positions[j][1][3];  // Y-coordinate of vleftRec center
                // Calculate the leftmost and rightmost positions of the single rectangle
                let vrightRecLeft = vrightRecX - 1.4;
                let vrightRecRight = vrightRecX + 1.4;
                // Calculate the topmost and bottommost positions of the single rectangle
                const vrightRecTop = vrightRecY - 12;
                const vrightRecBottom = vrightRecY + 12;
                if (this.player_location[0][3] < vrightRecRight && this.player_location[0][3] > vrightRecLeft && this.player_location[1][3] >= vrightRecTop &&
                    this.player_location[1][3] <= vrightRecBottom)
                {
                    this.gameOver = true;
                    this.start = false;                        
                }
            }

            // Draw vleftRec
            for (let i = 0; i < this.vleftRec_positions.length; i++) {

                this.vleftRec_positions[i][0][3] += recSpeed;
                var vleftRec_transform = this.vleftRec_positions[i].times(Mat4.scale(1, 12, 1));
                this.shapes.brick.draw(
                    context,
                    program_state,
                    vleftRec_transform,
                    this.materials.brick
                );
                if (this.vleftRec_positions[i][0][3] > 34) {
                    this.vleftRec_positions.splice(i, 1);
                    this.vleftRec_num -= 1;
                }
            }
            
            // Draw vrightRec
            for (let i = 0; i < this.vrightRec_positions.length; i++) {

                this.vrightRec_positions[i][0][3] -= recSpeed;
                var vrightRec_transform = this.vrightRec_positions[i].times(Mat4.scale(1, 12, 1));
                this.shapes.brick.draw(
                    context,
                    program_state,
                    vrightRec_transform,
                    this.materials.brick
                );
                if (this.vrightRec_positions[i][0][3] < -34) {
                    this.vrightRec_positions.splice(i, 1);
                    this.vrightRec_num -= 1;
                }
            }

            // Small Squares and Explosive Squares Implementations
            const smallSquare_xPos = Math.random() < 0.5 ? 36 : -36;
            const explosiveSquare_xPos = Math.random() < 0.5 ? 34 : -34;
            const smallSquare_yPos = Math.random() < 0.5 ? 19 : -19;
            let base_speedX = 0.1
            let base_speedY = 0.1
            if (this.score >= 16) {
                base_speedX = 0.15
                base_speedY = 0.15
            }
            const xVel = (Math.random() < 0.5 ? (base_speedX + Math.random() * base_speedX): (-base_speedX - Math.random() * base_speedX));
            const yVel = (Math.random() < 0.5 ? (base_speedY + Math.random() * base_speedY): (-base_speedY - Math.random() * base_speedY));
            const smallSquare_interval = 2;
            const explosiveSquare_interval = 5;
            let explosiveSquare_maxCnt = 3;
            let smallSquare_maxCnt = 5;

            if (this.score >= 25) {
                smallSquare_maxCnt = 3;
            }

            if (this.score >= 40) {
                smallSquare_maxCnt = 5;
            }

            // smallSquares spawning behaviors
            let smallSquare_t = t%smallSquare_interval;
            if (smallSquare_t >= (smallSquare_interval-0.019) && this.smallSquare_num < smallSquare_maxCnt) {
                this.smallSquare_positions.push(Mat4.identity().times(Mat4.translation(smallSquare_xPos,smallSquare_yPos,0))); // Initial position
                this.smallSquare_velocities.push(vec4(xVel, yVel, 0, 0)); // Initial velocity
                this.smallSquare_num += 1;
            }

            // ExplosiveSquares spawning behaviors
            let explosiveSquare_t = t%explosiveSquare_interval; 
            if (explosiveSquare_t >= (explosiveSquare_interval-0.02) && this.explosiveSquare_num < explosiveSquare_maxCnt && this.score >= 25) {
                this.explosiveSquare_positions.push(Mat4.identity().times(Mat4.translation(explosiveSquare_xPos,19,0))); // Initial position
                this.explosiveSquare_velocities.push(vec4(xVel, yVel, 0, 0)); // Initial velocity
                this.explosiveSquare_num += 1;
            }
            
            // Small Squares Movements
            for (let i = 0; i < this.smallSquare_positions.length; i++) {
                let smallSquare_dist = Math.sqrt(Math.pow(this.smallSquare_positions[i][0][3] - this.player_location[0][3], 2) + Math.pow(this.smallSquare_positions[i][1][3] - this.player_location[1][3], 2));
                
                // Collision Detection for Player with Small Squares
                if (smallSquare_dist > 0 && smallSquare_dist < 1.4 && this.player_location[2][3] == 0) {
                   this.gameOver = true;
                   this.start = false;
                } else {
                    // Follow the player if it is within a certain radius
                    let orbitinnerRadius = 5
                    let orbitoutterRadius = 12
                    if (this.score >= 16) {
                        orbitinnerRadius = 7
                        orbitoutterRadius = 12

                    }
                    if (smallSquare_dist > orbitinnerRadius && smallSquare_dist < orbitoutterRadius) {
                        // If it is to the right of the player
                        if (this.smallSquare_positions[i][0][3] >= this.player_location[0][3] + orbitinnerRadius && this.smallSquare_velocities[i][0] > 0) {
                            this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                        } 
                        // If it is to the left of the player
                        else if (this.smallSquare_positions[i][0][3] < this.player_location[0][3] - orbitinnerRadius && this.smallSquare_velocities[i][0] < 0) {
                            this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                        }
                        // If it is above of the player
                        if (this.smallSquare_positions[i][1][3] > this.player_location[1][3] + orbitinnerRadius-2.5 && this.smallSquare_velocities[i][1] > 0) {
                            this.smallSquare_velocities[i][1] = -this.smallSquare_velocities[i][1];
                        }
                        // If it is below of the player
                        else if (this.smallSquare_positions[i][1][3] < this.player_location[1][3] - orbitinnerRadius-2.5 && this.smallSquare_velocities[i][1] < 0) {
                            this.smallSquare_velocities[i][1] = -this.smallSquare_velocities[i][1];
                        }
                    }
                    // Bounce-Off-Wall behaviors
                    if (this.smallSquare_positions[i][0][3] + 0.125 >= xMax || this.smallSquare_positions[i][0][3] - 0.125 <= xMin) {
                        this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                    }
                    if (this.smallSquare_positions[i][1][3] + 0.125 >= yMax || this.smallSquare_positions[i][1][3] - 0.125 <= yMin) {
                        this.smallSquare_velocities[i][1] = -this.smallSquare_velocities[i][1];
                    }

                    // Bounce-Off-vleftRec bahaviors
                    for (let j = 0; j < this.vleftRec_positions.length; j++) {
                        let vleftRecX = this.vleftRec_positions[j][0][3];  // X-coordinate of vleftRec center
                        let vleftRecY = this.vleftRec_positions[j][1][3];  // Y-coordinate of vleftRec center

                        // Calculate the leftmost and rightmost positions of the single rectangle
                        let vleftRecLeft = vleftRecX - 1;
                        let vleftRecRight = vleftRecX + 1;
                        // Calculate the topmost and bottommost positions of the single rectangle
                        const vleftRecTop = vleftRecY - 12;
                        const vleftRecBottom = vleftRecY + 12;
                        if (this.smallSquare_positions[i][0][3] < vleftRecRight && this.smallSquare_positions[i][0][3] > vleftRecLeft && this.smallSquare_positions[i][1][3] >= vleftRecTop &&
                            this.smallSquare_positions[i][1][3] <= vleftRecBottom)
                        {
                            this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                            this.smallSquare_positions[i][0][3] += 4*this.smallSquare_velocities[i][0];
                        }
                    }

                    // Bounce-Off-vrightRec bahaviors
                    for (let j = 0; j < this.vrightRec_positions.length; j++) {
                        let vrightRecX = this.vrightRec_positions[j][0][3];  // X-coordinate of vleftRec center
                        let vrightRecY = this.vrightRec_positions[j][1][3];  // Y-coordinate of vleftRec center

                        // Calculate the leftmost and rightmost positions of the single rectangle
                        let vrightRecLeft = vrightRecX - 1;
                        let vrightRecRight = vrightRecX + 1;
                        // Calculate the topmost and bottommost positions of the single rectangle
                        const vrightRecTop = vrightRecY - 12;
                        const vrightRecBottom = vrightRecY + 12;
                        if (this.smallSquare_positions[i][0][3] < vrightRecRight && this.smallSquare_positions[i][0][3] > vrightRecLeft && this.smallSquare_positions[i][1][3] >= vrightRecTop &&
                            this.smallSquare_positions[i][1][3] <= vrightRecBottom)
                        {
                            this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                            if (this.score >= 16) {
                                this.smallSquare_positions[i][0][3] += 2*this.smallSquare_velocities[i][0];
        
                            } else {
                                this.smallSquare_positions[i][0][3] += 4*this.smallSquare_velocities[i][0];
                            }
                        }
                    }

                    // Drive Behaviors
                    if (this.smallSquare_positions[i][0][3] == this.player_location[0][3]) {
                        this.smallSquare_positions[i][1][3] += this.smallSquare_velocities[i][1];
                    } else if (this.smallSquare_positions[i][1][3] == this.player_location[1][3]) {
                        this.smallSquare_positions[i][0][3] += this.smallSquare_velocities[i][0];
                    } else {
                        this.smallSquare_positions[i][0][3] += this.smallSquare_velocities[i][0];
                        this.smallSquare_positions[i][1][3] += this.smallSquare_velocities[i][1];
                    }
                }
            }

            // Explosive Squares Movements
            for (let i = 0; i < this.explosiveSquare_positions.length; i++) {
                let explosiveSquare_dist = Math.sqrt(Math.pow(this.explosiveSquare_positions[i][0][3] - this.player_location[0][3], 2) + Math.pow(this.explosiveSquare_positions[i][1][3] - this.player_location[1][3], 2));
                
                // Collision Detection for Player with Small Squares
                if (explosiveSquare_dist > 0 && explosiveSquare_dist < 1.4 && this.player_location[2][3] == 0) {
                    this.gameOver = true;
                    this.start = false;
                } else {
                    // Follow the player if it is within a certain radius
                    let orbitinnerRadius = 7
                    let orbitoutterRadius = 12
                    if (explosiveSquare_dist > orbitinnerRadius && explosiveSquare_dist < orbitoutterRadius) {
                        // If it is to the right of the player
                        if (this.explosiveSquare_positions[i][0][3] >= this.player_location[0][3] + orbitinnerRadius && this.explosiveSquare_velocities[i][0] > 0) {
                            this.explosiveSquare_velocities[i][0] = -this.explosiveSquare_velocities[i][0];
                        } 
                        // If it is to the left of the player
                        else if (this.explosiveSquare_positions[i][0][3] < this.player_location[0][3] - orbitinnerRadius && this.explosiveSquare_velocities[i][0] < 0) {
                            this.explosiveSquare_velocities[i][0] = -this.explosiveSquare_velocities[i][0];
                        }
                        // If it is above of the player
                        if (this.explosiveSquare_positions[i][1][3] > this.player_location[1][3] + orbitinnerRadius-2.5 && this.explosiveSquare_velocities[i][1] > 0) {
                            this.explosiveSquare_velocities[i][1] = -this.explosiveSquare_velocities[i][1];
                        }
                        // If it is below of the player
                        else if (this.explosiveSquare_positions[i][1][3] < this.player_location[1][3] - orbitinnerRadius-2.5 && this.explosiveSquare_velocities[i][1] < 0) {
                            this.explosiveSquare_velocities[i][1] = -this.explosiveSquare_velocities[i][1];
                        }
                    }
                    // Bounce-Off-Wall behaviors
                    if (this.explosiveSquare_positions[i][0][3] + 0.125 >= xMax || this.explosiveSquare_positions[i][0][3] - 0.125 <= xMin) {
                        this.explosiveSquare_velocities[i][0] = -this.explosiveSquare_velocities[i][0];
                    }
                    if (this.explosiveSquare_positions[i][1][3] + 0.125 >= yMax || this.explosiveSquare_positions[i][1][3] - 0.125 <= yMin) {
                        this.explosiveSquare_velocities[i][1] = -this.explosiveSquare_velocities[i][1];
                    }

                    // Bounce-Off-vleftRec bahaviors
                    let explosionHit = false
                    for (let j = 0; j < this.vleftRec_positions.length; j++) {
                        let vleftRecX = this.vleftRec_positions[j][0][3];  // X-coordinate of vleftRec center
                        let vleftRecY = this.vleftRec_positions[j][1][3];  // Y-coordinate of vleftRec center

                        // Calculate the leftmost and rightmost positions of the single rectangle
                        let vleftRecLeft = vleftRecX - 1;
                        let vleftRecRight = vleftRecX + 1;
                        // Calculate the topmost and bottommost positions of the single rectangle
                        const vleftRecTop = vleftRecY - 12;
                        const vleftRecBottom = vleftRecY + 12;
                        if (this.explosiveSquare_positions[i][0][3] < vleftRecRight && this.explosiveSquare_positions[i][0][3] > vleftRecLeft && this.explosiveSquare_positions[i][1][3] >= vleftRecTop &&
                            this.explosiveSquare_positions[i][1][3] <= vleftRecBottom)
                        {
                  
                                let xPos = this.explosiveSquare_positions[i][0][3];
                                let yPos = this.explosiveSquare_positions[i][1][3];
                                this.explosiveSquare_num -= 1;
                                this.score += 2;
                                var scale_interval = Math.min(1.0, t / 2);
                                var currentScale = 0.5 + (6 - 0.5) * scale_interval;
                                var explosion_transform = Mat4.identity().times(Mat4.translation(xPos, yPos, 0))
                                .times(Mat4.scale(currentScale, currentScale, currentScale));
                                // Calculate the leftmost and rightmost positions of the explosion
                                let xLeft = xPos - 4;
                                let xRight = xPos + 4;
                                // Calculate the topmost and bottommost positions of the single rectangle
                                let yTop = yPos - 4;
                                let yBot = yPos + 4;
                                if (this.player_location[0][3] < xRight && this.player_location[0][3] > xLeft && this.player_location[1][3] >= yTop &&
                                    this.player_location[1][3] <= yBot)
                                {
                                    this.gameOver = true;
                                    this.start = false;                        
                                }
                                this.shapes.square.draw(context, program_state, explosion_transform, this.materials.explosion)
                                this.explosiveSquare_positions.splice(i, 1);
                                this.explosiveSquare_velocities.splice(i, 1);
                                explosionHit = true
                    }
                }

                    // Bounce-Off-vrightRec bahaviors
                    for (let j = 0; j < this.vrightRec_positions.length; j++) {
                        let vrightRecX = this.vrightRec_positions[j][0][3];  // X-coordinate of vleftRec center
                        let vrightRecY = this.vrightRec_positions[j][1][3];  // Y-coordinate of vleftRec center

                        // Calculate the leftmost and rightmost positions of the single rectangle
                        let vrightRecLeft = vrightRecX - 1;
                        let vrightRecRight = vrightRecX + 1;
                        // Calculate the topmost and bottommost positions of the single rectangle
                        const vrightRecTop = vrightRecY - 12;
                        const vrightRecBottom = vrightRecY + 12;
                        if (this.explosiveSquare_positions[i][0][3] < vrightRecRight && this.explosiveSquare_positions[i][0][3] > vrightRecLeft && this.explosiveSquare_positions[i][1][3] >= vrightRecTop &&
                            this.explosiveSquare_positions[i][1][3] <= vrightRecBottom)
                        {
                          
                                let xPos = this.explosiveSquare_positions[i][0][3];
                                let yPos = this.explosiveSquare_positions[i][1][3];

                                this.explosiveSquare_num -= 1;
                                this.score += 2;
                                var scale_interval = Math.min(1.0, t / 2);
                                var currentScale = 0.5 + (6 - 0.5) * scale_interval;
                                var explosion_transform = Mat4.identity().times(Mat4.translation(xPos, yPos, 0))
                                .times(Mat4.scale(currentScale, currentScale, currentScale));
                                // Calculate the leftmost and rightmost positions of the explosion
                                let xLeft = xPos - 4;
                                let xRight = xPos + 4;
                                // Calculate the topmost and bottommost positions of the single rectangle
                                let yTop = yPos - 4;
                                let yBot = yPos + 4;
                                if (this.player_location[0][3] < xRight && this.player_location[0][3] > xLeft && this.player_location[1][3] >= yTop &&
                                    this.player_location[1][3] <= yBot)
                                {
                                    this.gameOver = true;
                                    this.start = false;                        
                                }
                                this.shapes.square.draw(context, program_state, explosion_transform, this.materials.explosion)
                                this.explosiveSquare_positions.splice(i, 1);
                                this.explosiveSquare_velocities.splice(i, 1);
                                explosionHit = true

                        }
                    }

                    // Drive Behaviors
                    if(!explosionHit){
                        if (this.explosiveSquare_positions[i][0][3] == this.player_location[0][3]) {
                            this.explosiveSquare_positions[i][1][3] += this.explosiveSquare_velocities[i][1];
                        } else if (this.explosiveSquare_positions[i][1][3] == this.player_location[1][3]) {
                            this.explosiveSquare_positions[i][0][3] += this.explosiveSquare_velocities[i][0];
                        } else {
                            this.explosiveSquare_positions[i][0][3] += this.explosiveSquare_velocities[i][0];
                            this.explosiveSquare_positions[i][1][3] += this.explosiveSquare_velocities[i][1];
                        }
                    }
                }
            }

            // Collision Detection for Small squares
            for (let i = 0; i < this.smallSquare_positions.length; i++) {
                for (let j = 0; j < this.smallSquare_positions.length; j++) {
                    if(i != j) {
                        const dist = Math.sqrt(
                            Math.pow(this.smallSquare_positions[i][0][3] - this.smallSquare_positions[j][0][3], 2) +
                            Math.pow(this.smallSquare_positions[i][1][3] - this.smallSquare_positions[j][1][3], 2)
                          );

                        // Check if the distance is less than a threshold (indicating a collision)
                        if (dist < 1) {
                            this.smallSquare_positions.splice(j, 1);
                            this.smallSquare_velocities.splice(j, 1);
                            this.smallSquare_positions.splice(i, 1);
                            this.smallSquare_velocities.splice(i, 1);
                            this.smallSquare_num -= 2;
                            this.score += 2;
                        }

                    }
                }
            }

            // Collision Detection for Explosive squares            
            for (let i = 0; i < this.explosiveSquare_positions.length; i++) {

                for (let k = 0; k < this.smallSquare_positions.length; k++) {
                    if (i < this.explosiveSquare_positions.length) {
                        let explosion = false
                        let xPos = 0;
                        let yPos = 0
                        const dist = Math.sqrt(
                            Math.pow(this.explosiveSquare_positions[i][0][3] - this.smallSquare_positions[k][0][3], 2) +
                            Math.pow(this.explosiveSquare_positions[i][1][3] - this.smallSquare_positions[k][1][3], 2)
                        );

                        // Check if the distance is less than a threshold (indicating a collision)
                        if (dist < 1) {
                            xPos = this.explosiveSquare_positions[i][0][3];
                            yPos = this.explosiveSquare_positions[i][1][3];
                            explosion = true;
                            this.smallSquare_positions.splice(k, 1);
                            this.smallSquare_velocities.splice(k, 1);
                            this.explosiveSquare_positions.splice(i, 1);
                            this.explosiveSquare_velocities.splice(i, 1);
                            this.explosiveSquare_num -= 1;
                            this.smallSquare_num -= 1;
                            this.score += 2;
                        }

                        if (explosion == true) {
                            var scale_interval = Math.min(1.0, t / 2);
                            var currentScale = 0.5 + (6 - 0.5) * scale_interval;
                            var explosion_transform = Mat4.identity().times(Mat4.translation(xPos, yPos, 0))
                            .times(Mat4.scale(currentScale, currentScale, currentScale));
                            // Calculate the leftmost and rightmost positions of the explosion
                            let xLeft = xPos - 4;
                            let xRight = xPos + 4;
                            // Calculate the topmost and bottommost positions of the single rectangle
                            let yTop = yPos - 4;
                            let yBot = yPos + 4;
                            if (this.player_location[0][3] < xRight && this.player_location[0][3] > xLeft && this.player_location[1][3] >= yTop &&
                                this.player_location[1][3] <= yBot && this.player_location[2][3] == 0)
                            {
                                this.gameOver = true;
                                this.start = false;                        
                            }
                            this.shapes.square.draw(context, program_state, explosion_transform, this.materials.explosion)
                            
                        }
                    }
                }
                
                // With itself
                for (let j = 0; j < this.explosiveSquare_positions.length; j++) {
                    if(i != j && j < this.explosiveSquare_positions.length && i < this.explosiveSquare_positions.length) {
                        let explosion = false
                        let xPos = 0;
                        let yPos = 0
                        const dist = Math.sqrt(
                            Math.pow(this.explosiveSquare_positions[i][0][3] - this.explosiveSquare_positions[j][0][3], 2) +
                            Math.pow(this.explosiveSquare_positions[i][1][3] - this.explosiveSquare_positions[j][1][3], 2)
                        );

                        // Check if the distance is less than a threshold (indicating a collision)
                        if (dist < 1) {
                            xPos = this.explosiveSquare_positions[i][0][3];
                            yPos = this.explosiveSquare_positions[i][1][3];
                            explosion = true;
                            this.explosiveSquare_positions.splice(j, 1);
                            this.explosiveSquare_velocities.splice(j, 1);
                            this.explosiveSquare_positions.splice(i, 1);
                            this.explosiveSquare_velocities.splice(i, 1);
                            this.explosiveSquare_num -= 2;
                            this.score += 3;
                        }

                        if (explosion == true) {
                            var scale_interval = Math.min(1.0, t / 5);
                            var currentScale = 0.5 + (12 - 0.5) * scale_interval;
                            var explosion_transform = Mat4.identity().times(Mat4.translation(xPos, yPos, 0))
                            .times(Mat4.scale(currentScale, currentScale, currentScale));
                            // Calculate the leftmost and rightmost positions of the explosion
                            let xLeft = xPos - 8;
                            let xRight = xPos + 8;
                            // Calculate the topmost and bottommost positions of the single rectangle
                            let yTop = yPos - 8;
                            let yBot = yPos + 8;
                            if (this.player_location[0][3] < xRight && this.player_location[0][3] > xLeft && this.player_location[1][3] >= yTop &&
                                this.player_location[1][3] <= yBot && this.player_location[2][3] == 0)
                            {
                                this.gameOver = true;
                                this.start = false;                        
                            }
                            this.shapes.square.draw(context, program_state, explosion_transform, this.materials.explosion)
                        }

                    }
                }

            }

            // Draw the small Squares
            for (let i = 0; i < this.smallSquare_positions.length; i++) {
                var smallSquare_transform = this.smallSquare_positions[i].times(Mat4.scale(0.4, 0.4, 0.4));
                this.shapes.cube.draw(
                    context,
                    program_state,
                    smallSquare_transform,
                    this.materials.smallSquare
                );
            }

            // Draw the explosive Squares
            for (let i = 0; i < this.explosiveSquare_positions.length; i++) {
                var explosiveSquare_transform = this.explosiveSquare_positions[i].times(Mat4.scale(0.4, 0.4, 0.4));
                this.shapes.cube.draw(
                    context,
                    program_state,
                    explosiveSquare_transform,
                    this.materials.explosiveSquare
                );
            }
        }

    }
}