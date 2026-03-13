import sys
import subprocess
import os

def ensure_pil():
    try:
        from PIL import Image
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        from PIL import Image
    return Image

Image = ensure_pil()

in_path = r"C:\Users\sarve\.gemini\antigravity\brain\cfd0b8eb-1d10-4d5a-9d8d-d86e4f747afd\mentron_logo_1773336060149.png"
out_path = r"C:\Mentron_ap\mentron_new\mentron_flutter\assets\images\mentron_logo.png"

print(f"Opening {in_path}")
img = Image.open(in_path).convert("RGBA")
datas = img.getdata()

newData = []
for item in datas:
    # Check if pixel is very close to white
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        newData.append((255, 255, 255, 0)) # fully transparent
    else:
        newData.append(item)

img.putdata(newData)
img.save(out_path, "PNG")
print(f"Successfully generated transparent logo at {out_path}")
