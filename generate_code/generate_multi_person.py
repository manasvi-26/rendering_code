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

dir_path = "/home/manasvi/Computer_Vision/Honors-1/MUGL_DATA/WACV_MULTI/data"

    
def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.mkdir(folder_path)


def generate(filename):
    
    global path
    with h5py.File(os.path.join(dir_path,filename), "r") as f:
        # List all groups
        print("Keys: %s" % f.keys())

        # Get the data
        rot = np.array(f['pose'])
        root = np.array(f['root'])
        seq = np.array(f['seq'])
        print(seq.shape)
        print(root.shape)
        print(rot.shape)


        for sample in range(seq.shape[0]):


            rot_data = rot[sample]
            root_data = root[sample]
            total_frames = rot_data.shape[0]
            
            final_data = np.zeros(shape=(total_frames,2,24,4))
            for frame in range(total_frames):
                for person in range(2):
                    for joint in range(24):
                        mat = rot_data[frame][person][joint]
                        r =  R.from_matrix(mat)
                        quat = r.as_quat()
                        final_data[frame][person][joint] = quat
                            
            json_obj = {"rotation" : final_data.tolist()}
            
            create_folder("./WACV_MULTI/rotation_data/")
            create_folder("./WACV_MULTI/rotation_data/"+ filename.split(".")[0])

            path = "./WACV_MULTI/rotation_data/"+ filename.split(".")[0] + "/sample" + str(sample) + ".json"
            with open(path,"w+") as file:
                json.dump(json_obj,file,indent=4)

            #### TRANSLATION_DATA
            
            total_frames = root_data.shape[0]
            final_data = np.zeros(shape=(total_frames,2,1,3))
            print("translation shape --", total_frames)
            for frame in range(total_frames):
                for person in range(1):
                    for joint in range(1):
                        final_data[frame][person][joint] = root_data[frame]
                            
            json_obj = {"translation" : final_data.tolist()}
            
            create_folder("./WACV_MULTI/translation_data/")
            create_folder("./WACV_MULTI/translation_data/"+ filename.split(".")[0])

            path = "./WACV_MULTI/translation_data/"+ filename.split(".")[0] + "/sample" + str(sample) + ".json"
            with open(path,"w+") as file:
                json.dump(json_obj,file,indent=4)
            

if __name__ == "__main__":

    for file in os.listdir(dir_path):
        print(file)
        generate(file)
        