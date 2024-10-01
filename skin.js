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