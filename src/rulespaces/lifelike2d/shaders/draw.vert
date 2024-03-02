attribute vec2 position;

uniform mat4 uMatrix;

varying vec2 vCoord;

void main() {
    gl_Position = uMatrix * vec4(position, 0, 1);
    vCoord = position;
}