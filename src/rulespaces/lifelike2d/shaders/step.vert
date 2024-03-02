attribute vec4 aPosition;

uniform mat4 uMatrix;

varying vec2 vCoord;

void main() {
    gl_Position = uMatrix * aPosition;
    vCoord = (uMatrix * aPosition).xy;
}