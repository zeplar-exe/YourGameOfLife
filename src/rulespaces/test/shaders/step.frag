precision highp float;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform sampler2D uBirth;
uniform sampler2D uSurvive;

varying vec2 vTexcoord;

void main() {
  highp vec2 texelSize = 1.0 / uTextureSize;

  highp vec4 neighbors[8];
  neighbors[0] = texture2D(uTexture, vTexcoord + vec2(-texelSize.x, -texelSize.y)); // top-left
  neighbors[1] = texture2D(uTexture, vTexcoord + vec2(0.0, -texelSize.y));          // top
  neighbors[2] = texture2D(uTexture, vTexcoord + vec2(texelSize.x, -texelSize.y));  // top-right
  neighbors[3] = texture2D(uTexture, vTexcoord + vec2(-texelSize.x, 0.0));          // left
  neighbors[4] = texture2D(uTexture, vTexcoord + vec2(texelSize.x, 0.0));           // right
  neighbors[5] = texture2D(uTexture, vTexcoord + vec2(-texelSize.x, texelSize.y));  // bottom-left
  neighbors[6] = texture2D(uTexture, vTexcoord + vec2(0.0, texelSize.y));           // bottom
  neighbors[7] = texture2D(uTexture, vTexcoord + vec2(texelSize.x, texelSize.y));   // bottom-right
  float aliveNeighbors = 0.0;

  for (int i = 0; i < 8; i++) {
    if (neighbors[i].x == 1.0) {
      aliveNeighbors++;
    }
  }

  vec4 surviveColor = vec4(1, 1, 1, 1);
  vec4 dieColor = vec4(0, 0, 0, 1);

  float birth = texture2D(uBirth, vec2(aliveNeighbors/8.0, 0.0)).r;
  float survive = texture2D(uSurvive, vec2(aliveNeighbors/8.0, 0.0)).r;

  if (birth > 0.0 || survive > 0.0) {
    gl_FragColor = surviveColor;
  } else {
    gl_FragColor = dieColor;
  }
}