import os, subprocess, json

audio_dir = r'public\\audio'

for f in sorted(os.listdir(audio_dir)):
    if not f.endswith('.mp3'): continue
    p = os.path.join(audio_dir, f)
    res = subprocess.run(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', p], capture_output=True, text=True)
    try:
        dur = float(json.loads(res.stdout)['format']['duration'])
        if dur > 3.2:
            tmp_p = os.path.join(audio_dir, 'trim_' + f)
            cmd = ['ffmpeg', '-y', '-ss', '0', '-t', '3.0', '-i', p, '-af', 'afade=t=out:st=2.6:d=0.4', '-c:a', 'libmp3lame', '-b:a', '128k', tmp_p]
            subprocess.run(cmd, check=True, capture_output=True)
            os.replace(tmp_p, p)
            print(f'Trimmed {f}: {dur:.2f}s -> 3.00s')
        else:
            print(f'Kept {f}: {dur:.2f}s (<= 3s)')
    except Exception as e:
        print(f'Error on {f}: {e}')
