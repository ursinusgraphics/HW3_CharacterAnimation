/**
 * Skeleton code implementation for a half-edge mesh
 */
let vec3 = glMatrix.vec3;


///////////////////////////////////////////////////
//               MAIN MESH CLASS                 //
///////////////////////////////////////////////////

class SkinMesh extends BasicMesh {
    /**
     * 
     * @param {SkinCanvas} canvas Handle to canvas that contains this mesh
     * @param {WebGL} gl WebGL handle
     */
    constructor(canvas, gl){
        super();
        this.canvas = canvas;
        this.gl = gl;
        this.boneTransforms = [];
        this.boneNormalTransforms = [];
        this.boneIDs = new Float32Array(0);
        this.boneIDBuffer = null;
    }

    /**
     * Copy over vertex, triangle, and bone ID information to the GPU via
     * a WebGL handle.  Also copy over bone IDs and transformed normals
     * @param {WebGL handle} gl A handle to WebGL
     */
    updateBuffers(gl) {
        super.updateBuffers(gl);
        if (this.boneIDs.length > 0) {
            if (this.boneIDBuffer === null) {
                this.boneIDBuffer = gl.createBuffer();
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.boneIDBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.boneIDs, gl.STATIC_DRAW);
            this.boneIDBuffer.itemSize = 1;
            this.boneIDBuffer.numItems = this.boneIDs.length;
        }
        // Setup the normals in bone coordinates
        let invNormalTransforms = [];
        for (let i = 0; i < this.boneNormalTransforms.length; i++) {
            let TInv = glMatrix.mat3.create();
            glMatrix.mat3.invert(TInv, this.boneNormalTransforms[i]);
            invNormalTransforms.push(TInv);
        }
        //Normal buffers
        let N = new Float32Array(this.vertices.length*3);
        for (let i = 0; i < this.vertices.length; i++) {
            let n = glMatrix.vec3.create();
            const idx = this.boneIDs[i];
            glMatrix.vec3.transformMat3(n, this.origNormals[i], invNormalTransforms[idx]);
            for (let k = 0; k < 3; k++) {
                N[i*3+k] = n[k];
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, N, gl.STATIC_DRAW);
        this.normalBuffer.itemSize = 3;
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
        this.boneIDs = new Float32Array(this.vertices.length);
        for (let i = 0; i < this.vertices.length; i++) {
            this.boneIDs[i] = 0;
        }
        // Compute normals before any geometry changes
        this.origNormals = [];
        for (let i = 0; i < this.vertices.length; i++) {
            this.origNormals.push(this.vertices[i].getNormal());
        }
        // Setup a dummy transformation for the original mesh
        let T = glMatrix.mat4.create();
        this.updateBoneTransforms([T]);
        this.needsDisplayUpdate = true;
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
        if (X.length != this.vertices.length) {
            console.log("ERROR: Number of vertices passed along does not equal number of vertices in mesh");
            return;
        }
        // Step 1: Copy over vertices and bone IDs
        this.boneIDs = new Float32Array(boneIDs.length);
        for (let i = 0; i < X.length; i++) {
            this.vertices[i].pos = X[i];
            this.boneIDs[i] = boneIDs[i];
        }
        this.updateBoneTransforms(boneTransforms);
        this.updateBuffers(this.gl);
    }
    

    /** Bind all buffers according to what the shader accepts.
     * This includes vertex positions, normals, colors, lighting,
     * and triangle index buffers
     * In addition, bind all of the bone transformation matrices
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
        if ('vBoneIdxAttrib' in sProg) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.boneIDBuffer);
            gl.vertexAttribPointer(sProg.vBoneIdxAttrib , this.boneIDBuffer.itemSize, gl.FLOAT, false, 0, 0);
            // Send over bone transformations
            const numBones = this.boneTransforms.length;
            gl.uniform1i(sProg.u_numBones, numBones);
            for (let i = 0; i < numBones; i++) {
                gl.uniformMatrix4fv(sProg.u_boneTransforms[i], false, this.boneTransforms[i]);
                gl.uniformMatrix3fv(sProg.u_boneNormalTransforms[i], false, this.boneNormalTransforms[i]);
            }
        }
    }
}