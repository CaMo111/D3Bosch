import json
import math
from datetime import datetime

def haversine(lon1, lat1, lon2, lat2):
    # Convert latitude and longitude from degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    r = 6371  # Radius of Earth in kilometers
    return c * r * 1000  # Convert to meters

colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "gray", "cyan"]

def parse_line(line, prev_coordinates, accumulated_distance, participant_colors):
    fields = line.strip().split(',')
    
    # Check if the line has the expected number of fields
    if len(fields) < 25:
        return None, prev_coordinates, accumulated_distance  # Skip lines that do not have enough fields
    
    try:
        timestamp_str = fields[0]
        timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
        
        participant = int(fields[1])
        
        # Assign a color to the participant if not already assigned
        if participant not in participant_colors:
            participant_colors[participant] = colors[len(participant_colors) % len(colors)]
        
        colour = participant_colors[participant]
        current_coordinates = [float(fields[8]), float(fields[7])]
        distance = 0
        if prev_coordinates:
            distance = haversine(prev_coordinates[0], prev_coordinates[1], current_coordinates[0], current_coordinates[1])
        accumulated_distance += distance
        
        feature = {
            "type": "Feature",
            "properties": {
                "Timestamp": fields[0],
                "Participant": participant,
                "Activity": fields[2],
                "HR_mad_filtered": float(fields[3]) if fields[3] != 'NA' else None,
                "HRV": float(fields[4]) if fields[4] != 'NA' else None,
                "stress_xs": float(fields[5]) if fields[5] != 'NA' else None,
                "satisfaction_journey_xs": float(fields[6]) if fields[6] != 'NA' else None,
                "Event_Delay_xs": int(fields[11]),
                "Event_Disturbing_people_xs": int(fields[12]),
                "Event_Negative_Driving_xs": int(fields[13]),
                "Event_Infrastructure_xs": int(fields[14]),
                "Event_Positive_Interaction_xs": int(fields[15]),
                "Event_Media_Entertainment_xs": int(fields[16]),
                "Event_Reached_xs": int(fields[17]),
                "Event_Discomfort_xs": int(fields[18]),
                "Event_Comfortable_xs": int(fields[19]),
                "Event_Beautiful_xs": int(fields[20]),
                "emotion_open_xs": fields[21] if fields[21] != 'NA' else None,
                "Event_Free_xs": fields[22] if fields[22] != 'NA' else None,
                "Mode_keepmoving": fields[23] if len(fields) > 23 else None,
                "ModeButton_xs": fields[24] if len(fields) > 24 and fields[24] != 'NA' else None,
                "colour": colour,
                "accumulated_distance": accumulated_distance
            },
            "geometry": {
                "type": "Point",
                "coordinates": current_coordinates
            }
        }
        return feature, current_coordinates, accumulated_distance
    except (IndexError, ValueError):
        return None, prev_coordinates, accumulated_distance  # Skip lines with invalid data

def get_time_range(timestamp):
    hour = timestamp.hour
    if 5 <= hour < 9:
        return "morning"
    elif 9 <= hour < 15:
        return "midday"
    elif 15 <= hour < 20:
        return "afternoon"
    else:
        return "night"

def get_day_of_week(timestamp):
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    return days[timestamp.weekday()]

def write_geojson_files(features_by_day_and_time):
    data_folder = "data"

    for day in features_by_day_and_time:
        for time_range in features_by_day_and_time[day]:
            filename = f"{data_folder}/{day}_{time_range}.geojson"
            with open(filename, 'w') as f:
                geojson = {
                    "type": "FeatureCollection",
                    "features": features_by_day_and_time[day][time_range]
                }
                json.dump(geojson, f, indent=4)

# Read the boschdataset.txt file
with open('boschdataset.txt', 'r') as file:
    lines = file.readlines()

# Skip the header line
lines = lines[1:]

# Initialize structures for grouping features
features_by_day_and_time = {
    "monday": {"morning": [], "midday": [], "afternoon": [], "night": []},
    "tuesday": {"morning": [], "midday": [], "afternoon": [], "night": []},
    "wednesday": {"morning": [], "midday": [], "afternoon": [], "night": []},
    "thursday": {"morning": [], "midday": [], "afternoon": [], "night": []},
    "friday": {"morning": [], "midday": [], "afternoon": [], "night": []},
    "saturday": {"morning": [], "midday": [], "afternoon": [], "night": []},
    "sunday": {"morning": [], "midday": [], "afternoon": [], "night": []}
}

participant_colors = {}
prev_participant = None
prev_coordinates = None
accumulated_distance = 0

# Process each line in the input file
for line in lines:
    fields = line.strip().split(',')
    
    # Check if the line has the expected number of fields
    if len(fields) < 25:
        continue  # Skip lines that do not have enough fields
    
    try:
        participant = int(fields[1])
    except (IndexError, ValueError):
        continue  # Skip lines with invalid participant data
    
    if participant not in participant_colors:
        participant_colors[participant] = colors[len(participant_colors) % len(colors)]
    
    timestamp = datetime.strptime(fields[0], "%Y-%m-%d %H:%M:%S")
    day_of_week = get_day_of_week(timestamp)
    time_range = get_time_range(timestamp)
    
    # Check if the participant has changed
    if participant != prev_participant:
        # Reset accumulated distance and previous coordinates for the new participant
        prev_coordinates = None
        accumulated_distance = 0
        prev_participant = participant
    
    feature, prev_coordinates, accumulated_distance = parse_line(
        line, prev_coordinates, accumulated_distance, participant_colors)
    
    if feature:
        features_by_day_and_time[day_of_week][time_range].append(feature)

# Write the GeoJSON files
write_geojson_files(features_by_day_and_time)