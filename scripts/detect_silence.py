import os
import json
import subprocess
import re
import sys

# Ensure stdout handles UTF-8 correctly
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def parse_duration_to_seconds(duration_str):
    parts = duration_str.split(':')
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return 0

def format_seconds_to_duration(seconds):
    mins = int(seconds) // 60
    secs = int(seconds) % 60
    return f"{mins}:{secs:02d}"

def detect_trailing_silence(filepath):
    # Run ffmpeg with silencedetect
    # -45dB is a safe threshold for silent trailing parts, and duration of 3 seconds.
    cmd = [
        "ffmpeg", "-y", "-i", filepath,
        "-af", "silencedetect=noise=-42dB:d=3.0",
        "-f", "null", "-"
    ]
    
    process = subprocess.Popen(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    _, stderr = process.communicate()
    
    # Parse duration
    duration_match = re.search(r"Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)", stderr)
    if not duration_match:
        return None, None
        
    hours, minutes, seconds = duration_match.groups()
    total_duration = float(hours) * 3600 + float(minutes) * 60 + float(seconds)
    
    # Find all silence starts and ends
    silence_starts = [float(x) for x in re.findall(r"silence_start:\s*(\d+\.?\d*)", stderr)]
    silence_ends = [float(x) for x in re.findall(r"silence_end:\s*(\d+\.?\d*)", stderr)]
    
    if not silence_starts:
        return None, total_duration
        
    # Check if the last silence goes to the end of the file
    last_start = silence_starts[-1]
    
    # If there is one more silence_start than silence_ends, it means the silence goes to the end
    # Or if the last silence_end is close to total_duration
    goes_to_end = False
    if len(silence_starts) > len(silence_ends):
        goes_to_end = True
    elif silence_ends:
        last_end = silence_ends[-1]
        if abs(total_duration - last_end) < 2.0:
            goes_to_end = True
            
    if goes_to_end:
        # Trailing silence detected!
        # Make sure the trailing silence is significant (e.g. starts at least 3 seconds before the end)
        if total_duration - last_start >= 3.0:
            return round(last_start, 2), total_duration
            
    return None, total_duration

def main():
    inventory_path = "backend/media/tracks_inventory.json"
    media_dir = "backend/media"
    
    if not os.path.exists(inventory_path):
        print(f"Inventory file not found at {inventory_path}")
        return
        
    with open(inventory_path, "r", encoding="utf-8") as f:
        tracks = json.load(f)
        
    updated_count = 0
    for track in tracks:
        filename = track.get("filename")
        if not filename:
            continue
            
        filepath = os.path.join(media_dir, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
            
        print(f"Scanning {filename} ({track['title']})...")
        end_time, total_duration = detect_trailing_silence(filepath)
        
        if end_time is not None:
            formatted_trimmed = format_seconds_to_duration(end_time)
            print(f"  -> Trailing silence detected! Trimmed: {formatted_trimmed} (Original on disk: {format_seconds_to_duration(total_duration)}, JSON duration: {track['duration']})")
            track["endTime"] = int(end_time)
            if track["duration"] != formatted_trimmed:
                track["duration"] = formatted_trimmed
                updated_count += 1
        else:
            # Clean up key if it existed
            if "endTime" in track:
                del track["endTime"]
                updated_count += 1
            actual_duration_str = format_seconds_to_duration(total_duration)
            if track["duration"] != actual_duration_str:
                print(f"  -> Updating duration to match disk: {actual_duration_str} (JSON was: {track['duration']})")
                track["duration"] = actual_duration_str
                updated_count += 1
                
    if updated_count > 0:
        with open(inventory_path, "w", encoding="utf-8") as f:
            json.dump(tracks, f, indent=2, ensure_ascii=False)
        print(f"Updated {updated_count} tracks in inventory.")
    else:
        print("No trailing silence or duration mismatches found on any tracks.")

if __name__ == "__main__":
    main()
