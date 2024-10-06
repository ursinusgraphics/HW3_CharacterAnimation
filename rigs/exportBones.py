import bpy
import json

scene = bpy.data.scenes["Scene"]
armature = scene.objects["Armature"]
joints = {}

for bone in armature.pose.bones:
    name = bone.name
    pos = bone.tail
    joints[name] = dict(pos=(pos.x, pos.z, -pos.y))
    joints[name]["children"] = []
    for c in bone.children:
        joints[name]["children"].append(c.name)


mesh = scene.objects["homer"]
n_vertices = len(mesh.data.vertices)
for bone, group in mesh.vertex_groups.items():
    joints[bone]["weights"] = {}
    for i in range(n_vertices):
        try:
            w = group.weight(i)
            joints[bone]["weights"][i] = w
        except:
            pass
        
json.dump(joints, open("homer.json", "w"))