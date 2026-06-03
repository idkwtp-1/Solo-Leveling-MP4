import os
import json
import librosa
import numpy as np
import warnings

# Suppress librosa warnings about PySoundFile falling back to audioread for m4a files
warnings.filterwarnings('ignore', category=UserWarning)

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "media")
OUTPUT_FILE = os.path.join(MEDIA_DIR, "beat_drops.json")

def analyze_track(file_path):
    print(f"Analyzing {os.path.basename(file_path)}...")
    try:
        # Load audio at 22050 Hz for speed, mono channel
        y, sr = librosa.load(file_path, sr=22050, mono=True)
        
        # Calculate onset envelope (strength of note onsets/beats)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        
        # Define window for peak picking (roughly 3 seconds)
        frames_per_sec = sr / 512
        window = int(3 * frames_per_sec)
        
        # Find peaks in the onset envelope
        # We set a high delta to only catch the most prominent peaks (the "drops")
        peaks = librosa.util.peak_pick(
            onset_env, 
            pre_max=window, 
            post_max=window, 
            pre_avg=window, 
            post_avg=window, 
            delta=np.max(onset_env) * 0.45, 
            wait=window
        )
        
        if len(peaks) == 0:
            return []

        # Sort peaks by onset strength
        peak_strengths = onset_env[peaks]
        
        # Get the top 5 peaks (assuming max 5 major drops per song)
        top_peaks_idx = peaks[np.argsort(peak_strengths)[-5:]]
        
        # Convert frame indices to time (seconds)
        drop_times = librosa.frames_to_time(top_peaks_idx, sr=sr)
        
        # Sort chronologically
        drop_times = np.sort(drop_times)
        
        # Round to 3 decimals
        return [round(float(t), 3) for t in drop_times]
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")
        return []

def main():
    drops_data = {}
    
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r') as f:
            try:
                drops_data = json.load(f)
            except:
                pass

    files = [f for f in os.listdir(MEDIA_DIR) if f.endswith((".mp3", ".m4a", ".wav"))]
    total = len(files)
    
    print(f"Found {total} audio files to analyze.")
    
    FILENAME_TO_TRACK_ID = {
        "tiki_tiki_slowed": "tiki-tiki-slowed",
        "veki_veki_ultra_slowed": "veki-veki-slowed",
        "worry_ultra_slowed": "worry-slowed",
        "babydoll_the_perfect_girl": "babydoll-perfect-girl",
        "one_of_the_girls_good_for_you": "one-of-the-girls-mashup",
    }
    
    import re
    for idx, file in enumerate(files):
        base_name = os.path.splitext(file)[0]
        sanitized = re.sub(r'[^a-z0-9]+', '-', base_name.lower()).strip('-')
        track_id = FILENAME_TO_TRACK_ID.get(base_name, sanitized)
        
        if track_id in drops_data and len(drops_data[track_id]) > 0:
            print(f"[{idx+1}/{total}] Skipping {file}, already analyzed.")
            continue
            
        file_path = os.path.join(MEDIA_DIR, file)
        drops = analyze_track(file_path)
        drops_data[track_id] = drops
        
        # Save incrementally
        with open(OUTPUT_FILE, "w") as f:
            json.dump(drops_data, f, indent=2)
            
    print(f"Analysis complete. Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
