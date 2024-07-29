attribute vec4 aPosition;
attribute vec2 aTexcoord;

varying vec2 vTexcoord;

void main() {
    gl_Position = aPosition;
    vTexcoord = aTexcoord;
}