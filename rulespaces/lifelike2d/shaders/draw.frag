precision highp float;

uniform sampler2D uTilemap;

varying vec2 vCoord;

void main() {
  vec4 color = texture2D(uTilemap, vCoord);
  
  gl_FragColor = color;
}