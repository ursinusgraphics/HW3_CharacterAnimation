/**
 * Skeleton code implementation for a half-edge mesh
 */
let vec3 = glMatrix.vec3;


///////////////////////////////////////////////////
//               MAIN MESH CLASS                 //
///////////////////////////////////////////////////

class SkinMesh extends BasicMesh {
    constructor(gl){
        super();
        this.gl = gl;
        this.boneTransforms = [];
        this.boneNormalTransforms = [];
        this.boneIDs = new Int32Array(0);
        this.boneIDBuffer = null;
    }

    /**
     * Copy over vertex, triangle, and bone ID information to the GPU via
     * a WebGL handle
     * @param {WebGL handle} gl A handle to WebGL
     */
    updateBuffers(gl) {
        super.updateBuffers(gl);
        if (this.boneIDBuffer === null) {
            this.boneIDBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.boneIDBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.boneIDs, gl.STATIC_DRAW);
        this.boneIDBuffer.itemSize = 1;
        this.boneIDBuffer.numItems = this.boneIDs.length;
    }

    /**
     * Update bone world transformations and normal transformations
     * @param {list of K mat4} boneTransforms Transforms of each bone
     */
    updateBoneTransforms(boneTransforms) {
        // Step 2: Copy over transforms, computing normal transforms along the way
        this.boneTransforms = [];
        this.boneNormalTransforms = [];
        for (let i = 0; i < boneTransforms.length; i++) {
            const T = boneTransforms[i];
            this.boneTransforms.push(glMatrix.mat4.create());
            glMatrix.mat4.copy(this.boneTransforms[i], T);
            // Normal transform
            let nMatrix = glMatrix.mat3.create();
            glMatrix.mat3.normalFromMat4(nMatrix, T);
            this.boneNormalTransforms.push(nMatrix);
        }
        this.updateBuffers(this.gl);
        this.needsDisplayUpdate = true;
    }

    /**
     * Initialize a mesh from a set of formatted lines
     * The first time the mesh is loaded, we create a single "bone"
     * with the identity transform for all vertices
     * 
     * @param {object} lines The lines in the file
     * @param {boolean} verbose Whether to print information on the loaded mesh
     * @param {function} fn Function to use 
     */
    loadFileFromLines(lines, verbose, fn) {
        super.loadFileFromLines(lines, verbose, fn);
        this.boneIDs = new Int32Array(this.vertices.length);
        for (let i = 0; i < this.vertices.length; i++) {
            this.boneIDs[i] = 0;
        }
        this.updateBoneTransforms([glMatrix.mat4.create()]);
    }

    /**
     * Update the rig with relative coordinates of points in bone
     * frames, as well as bone world transformations and which point
     * belongs to which bone
     * 
     * @param {list of N vec3} X Coordinates of each point in its local bone
     *                         coordinate system
     * @param {list of N int} boneIDs IDs of the bone that each point belongs to
     * @param {list of K mat4} boneTransforms Transforms of each bone
     */
    updateRig(X, boneIDs, boneTransforms) {
        if (X.length != this.vertices[i].pos) {
            console.log("ERROR: Number of vertices passed along does not equal number of vertices in mesh");
            return;
        }
        // Step 1: Copy over vertices and bone IDs
        this.boneIDs = new Int32Array(boneIDs.length);
        for (let i = 0; i < X.length; i++) {
            this.vertices[i].pos = X[i];
            this.boneIDs[i] = boneIDs[i];
        }
        this.updateBoneTransforms(boneTransforms);
    }
    

    /** Bind all buffers according to what the shader accepts.
     * This includes vertex positions, normals, colors, lighting,
     * and triangle index buffers
     * 
     * @param {object} canvas canvas object (see render() doc for more info)
     * @param {object} sProg A shader program to use
     * @param {glMatrix.mat4} pMatrix The projection matrix
     * @param {glMatrix.mat4} mvMatrix The modelview matrix 
     * @param {glMatrix.mat4} tMatrix Transformation to apply to the mesh before viewing
     * 
     * */
    sendBuffersToGPU(canvas, sProg, pMatrix, mvMatrix, tMatrix) {
        super.sendBuffersToGPU(canvas, sProg, pMatrix, mvMatrix, tMatrix);
        // Send over bone IDs
        const gl = canvas.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.boneIDBuffer);
        gl.vertexAttribPointer(sProg.vBoneIdxAttrib , this.boneIDBuffer.itemSize, gl.INT, false, 0, 0);
        // Send over bone transformations
        const numBones = this.boneTransforms.length;
        gl.uniform1i(sProg.u_numBones, numBones);
        for (let i = 0; i < numBones; i++) {
            gl.uniformMatrix4fv(sProg.u_boneTransforms[i], false, this.boneTransforms[i]);
            gl.uniformMatrix3fv(sProg.u_boneNormalTransforms[i], false, this.boneNormalTransforms[i]);
        }
    }
}