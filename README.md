#Final Project - Report 
Project: Dodge
CS174A - Professor Asish Law

##Team Members:
Dylan Phe	UID: 505-834-475	Email: dylanphe@g.ucla.edu
Ming Chen	UID:  705-845-642      Email: ming95@g.ucla.edu
Brandon Tran, UID: 705-830-462	Email: tranbrandon1233@gmail.com

##Background and Development:

After several weeks of efforts in developing a prototype to the video game of the same name by Atridge, The proposed project, Dodge, is a computer graphics game created with TinyGraphics based on the famous video game of the same name by Atridge created for the Pico-8 game engine in 2019. The rules of the game are very simple: the player plays as a ball, and the goal is to dodge the red squares and rectangles that are randomly generated from all edges of the screen and within the screen boundaries. The rectangle will glide around from one edge of the screen to another. The smaller squares, on the other hand, once generated from the edge of the screen will levitate within screen boundaries and attempt to collide with the player. However, they can also collide with one another or the rectangle to cause an explosion. 

Based on the types of squares that collide, different explosions will be created. When the solid squares collide, there will be a harmless explosion
When the small hollow squares collide, it will create a shockwave in the form of a medium size hollow square that will kill the player upon contact.

##Goal:
The score is counted based on how many smaller squares have exploded before the player collides with one. As players accumulate a higher score, the level of difficulty will also increase and squares will be generated at an increasing rate.

##How to execute:
Run the host.bat file in the program folder. Then, enter localhost:[port number] in any web 
Browser. The port number will be provided in the command prompt when host.bat is
executed.

##Features:
Collision detection is included so the game will know if a player was hit by a ball and respond accordingly. Similarly, it will also be used to detect when the squares collide with one another to create the explosion effect and update the scores accordingly.
Small enemy squares will attempt to collide with the player and will end the game upon collision. They will also increase the score, cause an explosion, and disappear if they collide with each other.
Player interactivity using the arrow keys, which will allow the player to move throughout the screen.
A large enemy rectangle that will randomly spawn and glide across the screen. If the player collides with it, the game will end.
Explosions will occur upon collision of the squares and end the game if the player contacts them.


##How to operate:
Use the arrow keys to move the player. The goal is to dodge the squares and rectangles and 
attempt to cause them to collide to raise the player’s score.
 

