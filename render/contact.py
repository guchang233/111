"""Tile review frames into one contact sheet: python3 render/contact.py out.jpg a.jpg b.jpg ... (2 columns)."""
import subprocess, sys
out, files = sys.argv[1], sys.argv[2:]
cols = 2
rows = (len(files) + cols - 1) // cols
inputs = []
for f in files: inputs += ['-i', f]
n = len(files)
filt = ''.join(f'[{i}:v]scale=800:-1,drawtext=text=\'{f.split("/")[-1]}\':x=8:y=8:fontsize=16:fontcolor=red[s{i}];' for i, f in enumerate(files))
pad = ''
if n < rows * cols:
    filt += f'color=c=gray:s=800x450:d=1[pad];'
    pad = '[pad]'
layout = '|'.join(f'{(i % cols) * 800}_{(i // cols) * 450}' for i in range(rows * cols))
filt += ''.join(f'[s{i}]' for i in range(n)) + pad + f'xstack=inputs={rows*cols}:layout={layout}[o]'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', filt, '-map', '[o]', '-frames:v', '1', '-q:v', '3', out], check=True)
print(out)
