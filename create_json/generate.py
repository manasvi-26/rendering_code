import h5py
import numpy as np
import os
from os import path
import json
from scipy.spatial.transform import Rotation as R
import torch
from torch.nn import functional as F
from rot6d_to_quat import *
from rotation_conversions import matrix_to_quaternion,rotation_6d_to_matrix,matrix_to_euler_angles
from rotation import rot6d_to_rotmat
    
def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.mkdir(folder_path)

dir_path = "./ACTOR_DATA/"

if __name__ == "__main__":

    filename = "./ACTOR_NTUX94_preprocessed_Generated.h5"
    with h5py.File(filename, "r") as f:
        # List all groups
        print("Keys: %s" % f.keys())

        # Get the data
        y = np.array(f['y'])
        rot = np.array(f['x_in_rot6d'][:,:-1])
        print(rot.shape)

        f1 = open('action_names.txt','r')

        lines = f1.readlines()
        action_names = []
        for line in lines:
            action_name = line.split()
            action_names.append(action_name[0])
        
        y_samples = np.zeros(120)

        for sample in range(y.shape[0]):

            index = y[sample]
            action_name = action_names[index]
            print(action_name, sample)

            rot_data = rot[sample]
            rot_data = rot6d_to_rotmat(torch.from_numpy(rot_data))
            rot_data = np.array(rot_data).reshape((60,52,3,3))
            final_data = np.zeros(shape=(60,2,52,4))
            
            for frame in range(60):
                for person in range(1):
                    for joint in range(52):
                        mat = rot_data[frame][joint]
                        r =  R.from_matrix(mat)
                        quat = r.as_quat()
                        final_data[frame][person][joint] = quat
                            
            json_obj = {"rotation" : final_data.tolist()}

            action_folder = dir_path  + action_name
            create_folder(action_folder)

            path = action_folder + "/sample" + str(int(y_samples[index])) + ".json"
            
            y_samples[index]+=1 
            
            with open(path,"w+") as file:
                json.dump(json_obj,file,indent=4)
            