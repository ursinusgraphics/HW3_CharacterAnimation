import bpy
import json

scene = bpy.data.scenes["Scene"]
armature = scene.objects["Armature"]

joints = {}
for bone in armature.pose.bones:
    p = bone.tail
    children = [c.name for c in bone.children]
    joints[bone.name] = dict(pos=[p.x, p.z, -p.y], children=children, weights={})
#print(joints)

mesh = scene.objects["tr_reg_090"]
N = len(mesh.data.vertices)
for key, vg in mesh.vertex_groups.items():
    for i in range(N):
        try:
            w = vg.weight(i)
            joints[key]["weights"][i] = w
        except:
            pass

json.dump(joints, open("tr_reg_090.json", "w"))