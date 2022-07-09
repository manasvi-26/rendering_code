import h5py
import numpy as np
import os
from os import path
import json
from scipy.spatial.transform import Rotation as R
import torch
from torch.nn import functional as F

from generate_mugl_xpose import ntu_action_enumerator


def rotation_6d_to_matrix(d6: torch.Tensor) -> torch.Tensor:
    """
    Converts 6D rotation representation by Zhou et al. [1] to rotation matrix
    using Gram--Schmidt orthogonalisation per Section B of [1].
    Args:
        d6: 6D rotation representation, of size (*, 6)
    Returns:
        batch of rotation matrices of size (*, 3, 3)
    [1] Zhou, Y., Barnes, C., Lu, J., Yang, J., & Li, H.
    On the Continuity of Rotation Representations in Neural Networks.
    IEEE Conference on Computer Vision and Pattern Recognition, 2019.
    Retrieved from http://arxiv.org/abs/1812.07035
    """

    a1, a2 = d6[..., :3], d6[..., 3:]
    b1 = F.normalize(a1, dim=-1)
    b2 = a2 - (b1 * a2).sum(-1, keepdim=True) * b1
    b2 = F.normalize(b2, dim=-1)
    b3 = torch.cross(b1, b2, dim=-1)
    return torch.stack((b1, b2, b3), dim=-2)



dir_path = "./ACTOR_DATA/"
        
    
def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.mkdir(folder_path)

mapping = [  1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,
		14,  15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25,  26,
		27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,
		40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  61,  62,  63,
		64,  65,  66,  67,  68,  69,  70,  71,  72,  73,  74,  75,  76,
		77,  78,  79,  80,  81,  82,  83,  84,  85,  86,  87,  88,  89,
		90,  91,  92,  93,  94,  95,  96,  97,  98,  99, 100, 101, 102,
	   103, 104, 105]


if __name__ == "__main__":

    filename = "./ACTOR_NTUX94_preprocessed_Generated.h5"
    data = h5py.File(filename, "r")
    for k in data.keys():
        print(k,data[k].shape)
        



    
    #create main folder
    if not os.path.exists('ACTOR_DATA'):
        os.mkdir('ACTOR_DATA')

    y = np.array(data['y'])
    print(np.unique(y))

    N,J,_,T = data['x_in_rot6d'][:,:-1].shape   

    rot = data['x_in_rot6d'][:,:-1]
    rot = torch.from_numpy(rot).permute(0, 3, 1, 2)

    f1 = open('action_names.txt','r')

    lines = f1.readlines()
    action_names = []
    for line in lines:
        action_name = line.split()
        action_names.append(action_name[0])
    
    y_samples = np.zeros(120)


    for sample in range(1061,y.shape[0]):

        index = mapping[y[sample]]
        count = y_samples[index]

        
        action_name = action_names[index-1]
        print(action_name, sample)
        
        rot_data = rot[sample]

        final_rot_data = np.zeros(shape=(60,2,52,4))

        for frame in range(60):
            for person in range(1):
                for joint in range(52):
                    
                    mat = rotation_6d_to_matrix(rot_data[frame][joint])
                    r =  R.from_matrix(mat)
                    quat = r.as_quat()

                    final_rot_data[frame][person][joint] = quat
        
        json_obj = {"rotation" : final_rot_data.tolist()}

        action_folder = dir_path  + action_name
        create_folder(action_folder)

        path = action_folder + "/sample" + str(int(y_samples[index])) + ".json"
        
        y_samples[index]+=1 

        with open(path,"w+") as file:
                json.dump(json_obj,file,indent=4)
    

