// An example class you could use to encapsulate a joint
// (feel free to modify this)
class Joint {
  /**
   * @param {string} name Name of this joint
   * @param {vec3} pos Position of this joint
   */
  constructor(name, pos) {
    this.name = name;
    this.pos = glMatrix.vec3.clone(pos);
    this.leaf = false;
    this.parent = null;
    this.children = [];
  }
}

/**
 * Return a list of the vertex coordinates in a mesh
 * @param {SkinMesh} mesh The mesh
 * @returns List of vec3: Mesh vertices
 */
function getMeshVertices(mesh) {
  let X = [];
  for (let i = 0; i < mesh.vertices.length; i++) {
      X.push(glMatrix.vec3.clone(mesh.vertices[i].pos));
  }
  return X;
}

/**
 * 
 * @param {object} skeleton The skeleton information
 * @param {SkinMesh} mesh The mesh for rendering the skin
 */
function main(skeleton, mesh) {
  mesh.render(mesh.canvas);
  plotJoints(skeleton);
  let X = getMeshVertices(mesh);
  //plotSkin(X); // Uncomment this to plot the skin coordinates in the debug area
  // TODO: Fill this in (with lots of helper methods and classes)
  
}