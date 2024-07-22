precision highp float;

uniform sampler2D u_tilemap;
uniform vec2 u_gridSize;

varying vec2 v_coord;
varying vec2 v_texcoord; 

void main() {
  vec4 color = texture2D(u_tilemap, v_coord);
  
  gl_FragColor = color;
}