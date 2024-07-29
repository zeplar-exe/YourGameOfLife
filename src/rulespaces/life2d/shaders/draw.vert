attribute vec2 aPosition;
attribute vec2 aTexcoord;

uniform mat4 uMatrix;

varying vec2 vCoord;
varying vec2 vTexcoord; 

void main() {
    gl_Position = vec4(aPosition, 0, 0);

    vCoord = aPosition;
    vTexcoord = aTexcoord;
}