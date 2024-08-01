import cv2
import os
import pandas as pd
from pyzbar.pyzbar import decode

def read_qr_code(image_path):
    img = cv2.imread(image_path)
    decoded_objects = decode(img)
    if decoded_objects:
        return decoded_objects[0].data.decode('utf-8')
    return None

def main(folder_path, output_file):
    data = []
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            image_path = os.path.join(folder_path, filename)
            qr_data = read_qr_code(image_path)
            if qr_data:
                data.append([filename, qr_data])
    
    # Create a DataFrame and save to CSV
    df = pd.DataFrame(data, columns=['Filename', 'QR Data'])
    df.to_csv(output_file, index=False)
    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    folder_path = 'path/to/your/qr_photos'
    output_file = 'qr_data.csv'
    main(folder_path, output_file)