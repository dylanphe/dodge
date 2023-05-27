import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Dodge extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        // TODO: Fix Text_Line in common.js to correct draw text
        this.shapes = {
            sphere4: new defs.Subdivision_Sphere(4),
            cube: new defs.Cube(),
            score: new defs.Text_Line(20),
        };

        // *** Materials
        // TODO: ADD Texture
        this.materials = {
            player: new Material(new defs.Phong_Shader(),
                {ambient: .3, diffusivity: .5, color: hex_color("#0000FF")}),
            smallBalls: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#FF0000")}),
            scoreBox: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#FFFFFF")}),

        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 50), vec3(0, 0, 0), vec3(0, 1, 0));

        // Game State
        this.gameOver = false;

        // Player: Location and Interactivities
        this.score = 0;
        this.player_location = Mat4.identity();
        this.target_location = Mat4.identity();
        this.leftPressed = false;
        this.rightPressed = false;
        this.upPressed = false;
        this.downPressed = false;

        // Small Squares: Location and Velocities
        this.smallSquare_positions = [];
        this.smallSquare_velocities = [];
        this.smallSquare_num = 0;
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Move Left", ["ArrowLeft"], () => {this.leftPressed = true;});
        this.key_triggered_button("Move Right", ["ArrowRight"], () => {this.rightPressed = true;});
        this.new_line();
        this.key_triggered_button("Move Up", ["ArrowUp"], () => {this.upPressed = true;});
        this.key_triggered_button("Move Down", ["ArrowDown"], () => {this.downPressed = true;});
        this.new_line();
        this.new_line();
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
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // screen size
        // TODO: ADD BACKGROUND
        const xMin = -36.5;
        const xMax = 36.5;
        const yMin = -20;
        const yMax = 20;

        if (this.gameOver == false) {
            // TODO: ADD MORE TRANFORMATION EFFECTS TO EACH OBJECT (ROTATION and SUCH)
            // Interactivities functions
            if (this.leftPressed) {
                if (this.target_location[0][3] > xMin) {
                    this.target_location = this.target_location.times(Mat4.translation(-0.75,0,0));
                }
                this.leftPressed = false;
            } if (this.rightPressed) {
                if (this.target_location[0][3] < xMax) {
                    this.target_location = this.target_location.times(Mat4.translation(0.75,0,0));
                }
                this.rightPressed = false;
            } if (this.upPressed) {
                if (this.target_location[1][3] < yMax) {
                    this.target_location = this.target_location.times(Mat4.translation(0,0.75,0));
                }
                this.upPressed = false;
            } if (this.downPressed) {
                if (this.target_location[1][3] > yMin) {
                    this.target_location = this.target_location.times(Mat4.translation(0,-0.75,0));
                }
                this.downPressed = false;
            }

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

            // Small Squares Implementation
            let base_speedX = 0.1
            let base_speedY = 0.1
            const xPos = Math.random() < 0.5 ? 36 : -36;
            const yPos = Math.random() < 0.5 ? 19 : -19;
            const xVel = (Math.random() < 0.5 ? (base_speedX + Math.random() * base_speedX): (-base_speedX - Math.random() * base_speedX));
            const yVel = (Math.random() < 0.5 ? (base_speedY + Math.random() * base_speedY): (-base_speedY - Math.random() * base_speedY));
            //const yVel = Math.random() * (0.2 - (-0.2)) + (-0.2);
            const interval = 2;
            const maxCnt = 5;

            // Small Squares spawning behaviors
            let spawnInterval = t%interval;
            //console.log(spawnInterval);
            if (spawnInterval >= (interval-0.02) && this.smallSquare_num < maxCnt) {
                this.smallSquare_positions.push(Mat4.identity().times(Mat4.translation(xPos,yPos,0))); // Initial position
                this.smallSquare_velocities.push(vec4(xVel, yVel, 0, 0)); // Initial velocity
                this.smallSquare_num += 1;
            }
            
            // Small Square Movements
            for (let i = 0; i < this.smallSquare_positions.length; i++) {
                let distFromPlayer = Math.sqrt(Math.pow(this.smallSquare_positions[i][0][3] - this.player_location[0][3], 2) + Math.pow(this.smallSquare_positions[i][1][3] - this.player_location[1][3], 2));
                //let squareAngle = Math.tan(Math.abs(this.smallSquare_positions[1][3] - this.player_location[1][3])/Math.abs(this.smallSquare_positions[0][3] - this.player_location[0][3]));
                
                // Collision Detection for Player
                if (distFromPlayer > 0 && distFromPlayer < 1.4) {
                    this.gameOver = true;
                } else {
                    // Follow the player if it is within a certain radius
                    let orbitRadius = 5
                    if (distFromPlayer > orbitRadius && distFromPlayer < 12) {
                        // If it is to the right of the player
                        if (this.smallSquare_positions[i][0][3] >= this.player_location[0][3] + orbitRadius && this.smallSquare_velocities[i][0] > 0) {
                            this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                        } 
                        // If it is to the left of the player
                        else if (this.smallSquare_positions[i][0][3] < this.player_location[0][3] - orbitRadius && this.smallSquare_velocities[i][0] < 0) {
                            this.smallSquare_velocities[i][0] = -this.smallSquare_velocities[i][0];
                        }
                        // If it is above of the player
                        if (this.smallSquare_positions[i][1][3] > this.player_location[1][3] + orbitRadius-2.5 && this.smallSquare_velocities[i][1] > 0) {
                            this.smallSquare_velocities[i][1] = -this.smallSquare_velocities[i][1];
                        }
                        // If it is below of the player
                        else if (this.smallSquare_positions[i][1][3] < this.player_location[1][3] - orbitRadius-2.5 && this.smallSquare_velocities[i][1] < 0) {
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

            // Small Squares Collision Detection for Explosion
            // TODO: ADD EXPLOSION
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
                        this.score += 1;
                        }

                    }
                }
              }

            // Draw the smallBalls
            for (let i = 0; i < this.smallSquare_positions.length; i++) {
                var smallSquare_transform = this.smallSquare_positions[i].times(Mat4.scale(0.4, 0.4, 0.4));
                this.shapes.cube.draw(
                    context,
                    program_state,
                    smallSquare_transform,
                    this.materials.smallBalls
                );
            }


            // TODO: ADD Other obstacles

            // Display score
            let score_text = "Score: " + this.score;
            this.shapes.score.set_string(context, score_text, color(1, 1, 1, 1), 0.5);
            var scoreBox = Mat4.identity().times(Mat4.translation(-35,19,0));
            this.shapes.score.draw(
                context,
                program_state,
                scoreBox,
                this.materials.scoreBox
            );


    } 
    // GAME OVER
    else {
        /*var scoreBox = Mat4.identity().times(Mat4.translation(-35,19,0));
        this.shapes.cube.draw(
            context,
            program_state,
            scoreBox,
            this.materials.scoreBox
        );*/
    }


        /*// Calculate the fluctuating value between 0 and 1 using the sine function
        const fluctuatingValue = (1 + Math.sin(t * period)) / 2;
        const x = xMin + fluctuatingValue * (xMax - xMin);
        const y = yMin + fluctuatingValue * (yMax - yMin);

        // Apply the transformation to the ball
        let smallBalls_transform = Mat4.identity().times(Mat4.translation(x, y, ballPosition[2]))
                                    .times(Mat4.scale(0.5, 0.5, 0.5));*/

    }
}

/*class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;
        varying vec4 vertex_color;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
            varying vec4 v_color;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                // Compute an initial (ambient) color:
                v_color = vec4(shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                v_color.xyz += phong_model_lights( normalize(N), vertex_worldspace );
                vertex_color = v_color;
                
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                // Compute the final color with contributions from lights:
                gl_FragColor = vertex_color;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}*/
