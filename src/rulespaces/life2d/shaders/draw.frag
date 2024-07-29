precision highp float;

uniform sampler2D uTexture;
uniform vec2 uGridSize;

varying vec2 vCoord;
varying vec2 vTexcoord; 

void main() {
  vec4 color = texture2D(uTexture, vTexcoord);
  
  gl_FragColor = color;
}