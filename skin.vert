precision mediump float;
#define MAX_BONES 20

uniform int numBones;
uniform mat4 boneTransforms[MAX_BONES];
uniform mat3 boneNormalTransforms[MAX_BONES];

attribute vec3 vPos0;
attribute vec3 vNormal0;
attribute vec3 vColor0;
attribute float vBoneIdx0;
attribute float w0;

attribute vec3 vPos1;
attribute vec3 vNormal1;
attribute vec3 vColor1;
attribute float vBoneIdx1;
attribute float w1;

attribute vec3 vPos2;
attribute vec3 vNormal2;
attribute vec3 vColor2;
attribute float vBoneIdx2;
attribute float w2;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 tMatrix;

// Stuff to send to shader
varying vec3 V; // Position
varying vec3 N; // Normal
varying vec3 C; // Varying color


void main(void) {
    vec3 v = vec3(0.0, 0.0, 0.0);
    vec3 n = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < MAX_BONES; i++) {
        if (i < numBones) {
            if (vBoneIdx0 - float(i) == 0.0) {
                v = v + w0*(boneTransforms[i]*vec4(vPos0, 1.0)).xyz;
                n = n + w0*boneNormalTransforms[i]*vNormal0;
            }
            else if (vBoneIdx1 - float(i) == 0.0) {
                v = v + w1*(boneTransforms[i]*vec4(vPos1, 1.0)).xyz;
                n = n + w1*boneNormalTransforms[i]*vNormal1;
            }
            else if (vBoneIdx2 - float(i) == 0.0) {
                v = v + w2*(boneTransforms[i]*vec4(vPos2, 1.0)).xyz;
                n = n + w2*boneNormalTransforms[i]*vNormal2;
            }
        }
    }
    n = normalize(n);
    V = v;
    N = n;
    C = w0*vColor0 + w1*vColor1 + w2*vColor2;
    gl_Position = uPMatrix*uMVMatrix*tMatrix*vec4(v, 1.0);
}
