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

dir_path = "./Better-Generations/"

    
def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.mkdir(folder_path)


def generate(filename):
    
    global path
    with h5py.File(os.path.join(dir_path,filename), "r") as f:
        # List all groups
        print("Keys: %s" % f.keys())

        # Get the data
        rot = np.array(f['3d_rotation'])
        seq = np.array(f['sequence_length'])
        print(seq)
        print(rot.shape)


        for sample in range(rot.shape[0]):


            rot_data = rot[sample]
            
            final_data = np.zeros(shape=(seq[sample],2,52,4))
            for frame in range(seq[sample]):
                for person in range(1):
                    for joint in range(52):
                        mat = rot_data[frame][joint]
                        r =  R.from_matrix(mat)
                        quat = r.as_quat()
                        final_data[frame][person][joint] = quat
                            
            json_obj = {"rotation" : final_data.tolist()}
            
            create_folder("./WACV_DSAG")
            create_folder("./WACV_DSAG/"+ filename.split(".")[0])

            path = "./WACV_DSAG/"+ filename.split(".")[0] + "/sample" + str(sample) + ".json"
            with open(path,"w+") as file:
                json.dump(json_obj,file,indent=4)
            

if __name__ == "__main__":

    for file in os.listdir(dir_path):
        print(file)
        generate(file)