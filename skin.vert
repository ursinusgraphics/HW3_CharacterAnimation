precision mediump float;
#define MAX_BONES 20

uniform int numBones;
uniform mat4 boneTransforms[MAX_BONES];
uniform mat3 boneNormalTransforms[MAX_BONES];

attribute vec3 vPos;
attribute vec3 vNormal;
attribute vec3 vColor;
attribute float vBoneIdx;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 tMatrix;

// Stuff to send to shader
varying vec3 V; // Position
varying vec3 N; // Normal
varying vec3 C; // Varying color


void main(void) {
    vec4 v = vec4(vPos, 1.0);
    vec3 n = vNormal;
    for (int i = 0; i < MAX_BONES; i++) {
        if (i < numBones) {
            if (vBoneIdx - float(i) == 0.0) {
                v = boneTransforms[i]*v;
                n = boneNormalTransforms[i]*n;
            }
        }
    }
    C = vColor;
    N = n;
    gl_Position = uPMatrix*uMVMatrix*tMatrix*v;
}
