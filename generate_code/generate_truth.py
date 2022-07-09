import h5py
import numpy as np
import os
from os import path
import json
from scipy.spatial.transform import Rotation as R


dir_path = 'WACV_GROUND/'

def create_folder(folder_path):
    if not os.path.exists(folder_path):
        os.mkdir(folder_path)


if __name__ == "__main__":

    create_folder(dir_path)

    filename = ""

    with h5py.File(filename, "r") as f:
        y = np.array(f['y'])
        print(y.shape)
        

        f1 = open('GROUND_TRUTH_FINGER/action_names.txt','r')

        lines = f1.readlines()
        action_names = []
        for line in lines:
            action_name = line.split()
            action_names.append(action_name[0])
        
        y_samples = np.zeros(120)

        for sample in range(y.shape[0]):
            index = y[sample] - 1
            action_name = action_names[index]
            print(action_name, sample)
            rot_data = np.array(f['pose_preprocessed'][sample])
            seq_len = rot_data.shape[0]

            final_data = np.zeros(shape=(seq_len,2,52,4))
            for frame in range(seq_len):
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