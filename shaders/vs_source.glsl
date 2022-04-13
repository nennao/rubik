attribute vec4 a_VertexPosition;
attribute vec4 a_VertexColor;

varying vec4 v_Color;


void main() {
    gl_Position = a_VertexPosition;

    v_Color = a_VertexColor;
}
