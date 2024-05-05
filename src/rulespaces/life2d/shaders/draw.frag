precision highp float;

uniform sampler2D uTilemap;
uniform vec2 uGridSize;

varying vec2 vCoord;

void main() {
  vec2 coord = vCoord;
  vec4 color = texture2D(uTilemap, coord * uGridSize);
  
  gl_FragColor = vec4(1, 1, 0, 1);
}