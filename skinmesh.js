/**
 * Skeleton code implementation for a half-edge mesh
 */
let vec3 = glMatrix.vec3;
let mat3 = glMatrix.mat3;
let mat4 = glMatrix.mat4;

const TAB20_COLORS = [
    [0.12156863, 0.46666667, 0.70588235],
    [0.68235294, 0.78039216, 0.90980392],
    [1.        , 0.49803922, 0.05490196],
    [1.        , 0.73333333, 0.47058824],
    [0.17254902, 0.62745098, 0.17254902],
    [0.59607843, 0.8745098 , 0.54117647],
    [0.83921569, 0.15294118, 0.15686275],
    [1.        , 0.59607843, 0.58823529],
    [0.58039216, 0.40392157, 0.74117647],
    [0.77254902, 0.69019608, 0.83529412],
    [0.54901961, 0.3372549 , 0.29411765],
    [0.76862745, 0.61176471, 0.58039216],
    [0.89019608, 0.46666667, 0.76078431],
    [0.96862745, 0.71372549, 0.82352941],
    [0.49803922, 0.49803922, 0.49803922],
    [0.78039216, 0.78039216, 0.78039216],
    [0.7372549 , 0.74117647, 0.13333333],
    [0.85882353, 0.85882353, 0.55294118],
    [0.09019608, 0.74509804, 0.81176471],
    [0.61960784, 0.85490196, 0.89803922]
];

///////////////////////////////////////////////////
//               MAIN MESH CLASS                 //
///////////////////////////////////////////////////

class SkinMesh extends BasicMesh {
    /**
     * 
     * @param {SkinCanvas} canvas Handle to canvas that contains this mesh
     * @param {WebGL} gl WebGL handle
     * @param {int} nBlend Number of bones to blend together 
     */
    constructor(canvas, gl, nBlend){
        super();
        this.canvas = canvas;
        this.gl = gl;
        this.boneTransforms = [];
        this.boneNormalTransforms = [];
        this.boneNormalTransformsInv = [];

        // Attributes for each blend index
        this.nBlend = nBlend;
        this.vPosBuffer = [...Array(nBlend).keys()].map(() => null);
        this.vNormalBuffer = [...Array(nBlend).keys()].map(() => null);
        this.vColorBuffer = [...Array(nBlend).keys()].map(() => null);
        this.vBoneIDBuffer = [...Array(nBlend).keys()].map(() => null);
        this.vWeightBuffer = [...Array(nBlend).keys()].map(() => null);

    }

    /**
     * Update bone world transformations and normal transformations
     * @param {list of K mat4} boneTransforms Transforms of each bone
     */
    updateBoneTransforms(boneTransforms) {
        // Step 2: Copy over transforms, computing normal transforms along the way
        this.boneTransforms = [];
        this.boneNormalTransforms = [];
        this.boneNormalTransformsInv = [];
        for (let i = 0; i < boneTransforms.length; i++) {
            const T = boneTransforms[i];
            this.boneTransforms.push(glMatrix.mat4.create());
            glMatrix.mat4.copy(this.boneTransforms[i], T);
            // Normal transform
            let nMatrix = glMatrix.mat3.create();
            glMatrix.mat3.normalFromMat4(nMatrix, T);
            this.boneNormalTransforms.push(nMatrix);
            // Inverse normal transform
            let nMatrixInv = glMatrix.mat3.create();
            glMatrix.mat3.invert(nMatrixInv, nMatrix);
            this.boneNormalTransformsInv.push(nMatrixInv);
        }
    }

    /**
     * @param {list of list of N vec3} Ys For each blend ID, list of coordinates of each point in 
     *                                    its local bone coordinate system
     * @param {list of list of N int} boneIDs For each blend ID, IDs of the bone that each point belongs to
     * @param {list of list of N int} weights For each blend ID, weights of each point with respect to its bone
     * @param {boolean} useBoneColors If true, use colors based on the bone indices 
    */
    updateBlendBuffers(Ys, boneIDs, weights, useBoneColors) {
        const gl = this.gl;

        // Step 3: Setup buffers for vertex, normal, color, bone index, and weight
        for (let k = 0; k < this.nBlend; k++) {
            let Yk = Ys[k];
            let boneIDsk = boneIDs[k];
            let weightsk = weights[k];
            let nPoints = Yk.length;
            console.log("Updating blend buffer for", nPoints, "points");

            // Step 2a: Vertex data
            if (this.vPosBuffer[k] === null) {
                this.vPosBuffer[k] = gl.createBuffer();
            }
            let P = new Float32Array(nPoints*3);
            for (let i = 0; i < nPoints; i++) {
                for (let k = 0; k < 3; k++) {
                    P[i*3+k] = Yk[i][k];
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vPosBuffer[k]);
            gl.bufferData(gl.ARRAY_BUFFER, P, gl.STATIC_DRAW);
            this.vPosBuffer[k].itemSize = 3;
            this.vPosBuffer[k].numItems = nPoints;

            // Step 2b: Normal data
            if (this.vNormalBuffer[k] === null) {
                this.vNormalBuffer[k] = gl.createBuffer();
            }
            let N = new Float32Array(nPoints*3);
            for (let i = 0; i < nPoints; i++) {
                let n = glMatrix.vec3.create();
                glMatrix.vec3.transformMat3(n, this.origNormals[i], this.boneNormalTransformsInv[boneIDsk[i]]);
                for (let k = 0; k < 3; k++) {
                    N[i*3+k] = n[k];
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vNormalBuffer[k]);
            gl.bufferData(gl.ARRAY_BUFFER, N, gl.STATIC_DRAW);
            this.vNormalBuffer[k].itemSize = 3;

            // Step 2c: Color data
            if (this.vColorBuffer[k] === null) {
                this.vColorBuffer[k] = gl.createBuffer();
            }
            let gray = [1, 1, 1];
            let C = new Float32Array(nPoints*3);
            for (let i = 0; i < nPoints; i++) {
                let c = gray;
                if (useBoneColors) {
                    c = TAB20_COLORS[boneIDsk[i]%TAB20_COLORS.length];
                }
                for (let k = 0; k < 3; k++) {
                    C[i*3+k] = c[k];
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vColorBuffer[k]);
            gl.bufferData(gl.ARRAY_BUFFER, C, gl.STATIC_DRAW);
            this.vColorBuffer[k].itemSize = 3;

            // Step 2d: Bone index data
            if (this.vBoneIDBuffer[k] === null) {
                this.vBoneIDBuffer[k] = gl.createBuffer();
            }
            let B = new Float32Array(nPoints);
            for (let i = 0; i < nPoints; i++) {
                B[i] = boneIDsk[i];
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vBoneIDBuffer[k]);
            gl.bufferData(gl.ARRAY_BUFFER, B, gl.STATIC_DRAW);
            this.vBoneIDBuffer[k].itemSize = 1;

            // Step 2e: Weight data
            if (this.vWeightBuffer[k] === null) {
                this.vWeightBuffer[k] = gl.createBuffer();
            }
            let W = new Float32Array(nPoints);
            for (let i = 0; i < nPoints; i++) {
                W[i] = weightsk[i];
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vWeightBuffer[k]);
            gl.bufferData(gl.ARRAY_BUFFER, W, gl.STATIC_DRAW);
            this.vWeightBuffer[k].itemSize = 1;
        }
    }

    /**
     * Initialize a mesh from a set of formatted lines
     * The first time the mesh is loaded, we create a single "bone"
     * with the identity transform for all vertices for all blends
     * 
     * @param {object} lines The lines in the file
     * @param {boolean} verbose Whether to print information on the loaded mesh
     * @param {function} fn Function to use 
     */
    loadFileFromLines(lines, verbose, fn) {
        super.loadFileFromLines(lines, verbose, fn);
        // Step 1: Compute normals before any geometry changes
        this.origNormals = [];
        for (let i = 0; i < this.vertices.length; i++) {
            this.origNormals.push(this.vertices[i].getNormal());
        }

        // Step 2: Send over the identity transform for the single dummy bone
        this.updateBoneTransforms([glMatrix.mat4.create()]);

        // Step 3: Create dummy data for the blend info with the first blend
        // points equal to the original mesh with all 1 weights
        let Ys = [];
        let weights = [];
        let boneIDs = [];
        for (let i = 0; i < this.nBlend; i++) {
            Ys.push(this.vertices.map(v=>[v.pos[0], v.pos[1], v.pos[2]]));
            let weight = 1;
            if (i > 0) {
                weight = 0;
            }
            weights.push(this.vertices.map(()=>weight));
            boneIDs.push(this.vertices.map(()=>0));
        }
        this.updateBlendBuffers(Ys, boneIDs, weights, false);
        this.needsDisplayUpdate = true;
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
        const gl = canvas.gl;

        // Step 1: Send over bone transformation uniforms
        const numBones = this.boneTransforms.length;
        gl.uniform1i(sProg.u_numBones, numBones);
        for (let i = 0; i < numBones; i++) {
            gl.uniformMatrix4fv(sProg.u_boneTransforms[i], false, this.boneTransforms[i]);
            gl.uniformMatrix3fv(sProg.u_boneNormalTransforms[i], false, this.boneNormalTransforms[i]);
        }

        // Step 2: Send over blend information
        for (let k = 0; k < this.nBlend; k++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vPosBuffer[k]);
            gl.vertexAttribPointer(sProg["vPos"+k+"Attrib"], 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vNormalBuffer[k])
            gl.vertexAttribPointer(sProg["vNormal"+k+"Attrib"], 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vColorBuffer[k])
            gl.vertexAttribPointer(sProg["vColor"+k+"Attrib"], 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vBoneIDBuffer[k]);
            gl.vertexAttribPointer(sProg["vBoneIdx"+k+"Attrib"], 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vWeightBuffer[k]);
            gl.vertexAttribPointer(sProg["w"+k+"Attrib"], 1, gl.FLOAT, false, 0, 0);
        }
    }

    /**
     * Update the rig with relative coordinates of points in bone
     * frames, as well as bone world transformations and which point
     * belongs to which bone
     * 
     * @param {list of list of N vec3} Ys For each blend ID, list of coordinates of each point in 
     *                                    its local bone coordinate system
     * @param {list of list of N int} boneIDs For each blend ID, IDs of the bone that each point belongs to
     * @param {list of list of N int} weights For each blend ID, weights of each point with respect to its bone
     * @param {list of K mat4} boneTransforms Transforms of each bone
     * @param {boolean} useBoneColors If true, use colors based on the bone indices 
     */
    updateRig(Ys, boneIDs, weights, boneTransforms, useBoneColors) {
        let N = this.vertices.length;
        if (Ys.length != this.nBlend) {
            console.log("ERROR: Expecting " + this.nBlend + " sets of points, but only passed over " + Ys.length + " elements in Ys");
            return;
        }
        if (boneIDs.length != this.nBlend) {
            console.log("ERROR: Expecting " + this.nBlend + " sets of bone IDs, but only passed over " + Ys.length + " elements in boneIDs");
            return;
        }
        if (weights.length != this.nBlend) {
            console.log("ERROR: Expecting " + this.nBlend + " sets of points, but only passed over " + weights.length + " elements in weights");
            return;
        }
        for (let i = 0; i < Ys.length; i++) {
            if (Ys[i].length != N) {
                console.log("ERROR: Number of vertices passed along for Y[" + i + "] does not equal number of vertices in mesh");
                return;
            }
            if (boneIDs[i].length != N) {
                console.log("ERROR: Number of bone indices passed along for boneIDs[" + i + "] does not equal number of vertices in mesh");
                return;
            }
            if (weights[i].length != N) {
                console.log("ERROR: Number of bone indices passed along for weights[" + i + "] does not equal number of vertices in mesh");
                return;
            }
            
        }
        if (useBoneColors === undefined) {
            useBoneColors = false;
        }
        this.updateBoneTransforms(boneTransforms);
        this.updateBlendBuffers(Ys, boneIDs, weights, useBoneColors);
    }

}