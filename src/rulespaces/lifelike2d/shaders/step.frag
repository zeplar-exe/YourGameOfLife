precision highp float;

uniform sampler2D uPrevious;
uniform vec2 uCellSize;
uniform bool uBirth[9];
uniform bool uSurvive[9];

varying vec2 vCoord;

void main() {
  float topLeft = texture2D(uPrevious, vCoord + vec2(-1, -1) * uCellSize).x;
  float left = texture2D(uPrevious, vCoord + vec2(-1, +0) * uCellSize).x;
  float bottomLeft = texture2D(uPrevious, vCoord + vec2(-1, +1) * uCellSize).x;
  float top = texture2D(uPrevious, vCoord + vec2(+0, -1) * uCellSize).x;
  float bottom = texture2D(uPrevious, vCoord + vec2(+0, +1) * uCellSize).x;
  float topRight = texture2D(uPrevious, vCoord + vec2(+1, -1) * uCellSize).x;
  float right = texture2D(uPrevious, vCoord + vec2(+1, +0) * uCellSize).x;
  float bottomRight = texture2D(uPrevious, vCoord + vec2(+1, +1) * uCellSize).x;

  float current = texture2D(uPrevious, vCoord).x;

  int neighbors = int(topLeft + left + bottomLeft + top + bottom + topRight + right + bottomRight);

  if (current < 0.5) {
    if (uBirth[neighbors]) {
      gl_FragColor = vec4(1, 1, 1, 1);
    } else {
      gl_FragColor = vec4(0, 0, 0, 1);
    }
  } else {
    if (uSurvive[neighbors]) {
      gl_FragColor = vec4(1, 1, 1, 1);
    } else {
      gl_FragColor = vec4(0, 0, 0, 1);
    }
  }
}