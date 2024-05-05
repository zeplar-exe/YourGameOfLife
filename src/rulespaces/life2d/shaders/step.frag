precision highp float;

uniform sampler2D uPrevious;
uniform vec2 uPhysicalCellSize;
uniform sampler2D uBirth;
uniform sampler2D uSurvive;

varying vec2 vCoord;

void main() {
  float topLeft = texture2D(uPrevious, vCoord + vec2(-1, -1) * uPhysicalCellSize).x;
  float left = texture2D(uPrevious, vCoord + vec2(-1, +0) * uPhysicalCellSize).x;
  float bottomLeft = texture2D(uPrevious, vCoord + vec2(-1, +1) * uPhysicalCellSize).x;
  float top = texture2D(uPrevious, vCoord + vec2(+0, -1) * uPhysicalCellSize).x;
  float bottom = texture2D(uPrevious, vCoord + vec2(+0, +1) * uPhysicalCellSize).x;
  float topRight = texture2D(uPrevious, vCoord + vec2(+1, -1) * uPhysicalCellSize).x;
  float right = texture2D(uPrevious, vCoord + vec2(+1, +0) * uPhysicalCellSize).x;
  float bottomRight = texture2D(uPrevious, vCoord + vec2(+1, +1) * uPhysicalCellSize).x;

  float current = texture2D(uPrevious, vCoord).x;

  int neighbors = 8 - int(topLeft + left + bottomLeft + top + bottom + topRight + right + bottomRight);

  if (current < 0.5) {
    if (texture2D(uBirth, vec2(neighbors, 0)).x == 1.0) {
      gl_FragColor = vec4(1, 1, 1, 1);
    } else {
      gl_FragColor = vec4(0, 0, 0, 1);
    }
  } else {
    if (texture2D(uSurvive, vec2(neighbors, 0)).x == 1.0) {
      gl_FragColor = vec4(1, 1, 1, 1);
    } else {
      gl_FragColor = vec4(0, 0, 0, 1);
    }
  }
}