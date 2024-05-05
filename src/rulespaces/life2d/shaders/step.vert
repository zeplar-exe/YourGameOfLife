attribute vec4 position;

uniform mat4 uMatrix;

varying vec2 vCoord;

void main() {
    gl_Position = uMatrix * position;
    
    vCoord = (uMatrix * position).xy;
}