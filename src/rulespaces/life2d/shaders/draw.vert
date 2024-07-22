attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_coord;
varying vec2 v_texcoord; 

void main() {
    gl_Position = vec4(a_position, 0, 0);

    v_coord = a_position;
    v_texcoord = a_texcoord;
}