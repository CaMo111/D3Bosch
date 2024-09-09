import json
import math
import random
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

def parse_line(line):
    fields = line.strip().split(',')
    
    # Check if the line has the expected number of fields
    if len(fields) < 25:
        return None  # Skip lines that do not have enough fields
    
    timestamp_str = fields[0]
    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
    
    # Filter for journeys between 6:30 AM and 8:00 AM
    if timestamp.time() >= datetime.strptime("06:30:00", "%H:%M:%S").time() and timestamp.time() <= datetime.strptime("08:00:00", "%H:%M:%S").time():
        current_coordinates = [float(fields[8]), float(fields[7])]
        
        feature = {
            "type": "Feature",
            "properties": {
                "Timestamp": fields[0],
                "Participant": int(fields[1]),
                "Activity": fields[2],
                "HR_mad_filtered": float(fields[3]) if fields[3] != 'NA' else None,
                "HRV": float(fields[4]) if fields[4] != 'NA' else None,
                "stress_xs": float(fields[5]) if fields[5] != 'NA' else None,
                "satisfaction_journey_xs": float(fields[6]) if fields[6] != 'NA' else None,
                #"Gender": fields[9] if fields[9] != 'NA' else None,
                #"Age": fields[10] if fields[10] != 'NA' else None,
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
                "ModeButton_xs": fields[24] if len(fields) > 24 and fields[24] != 'NA' else None
            },
            "geometry": {
                "type": "Point",
                "coordinates": current_coordinates
            }
        }
        return feature
    return None

# Read the boschdataset.txt file
with open('boschdataset.txt', 'r') as file:
    lines = file.readlines()

# Skip the header line
lines = lines[1:]

# Create the GeoJSON structure
geojson = {
    "type": "FeatureCollection",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "features": []
}

reference_coordinates = [10.538761725, 52.252495764]
participant_trips = {}
participant_colors = {}
for line in lines:
    feature = parse_line(line)
    if feature is not None:
        participant = feature["properties"]["Participant"]
        if participant not in participant_trips:
            participant_trips[participant] = []
            # Assign a random color to the participant
            participant_colors[participant] = "#{:06x}".format(random.randint(0, 0xFFFFFF))
        feature["properties"]["colour"] = participant_colors[participant]
        participant_trips[participant].append(feature)

# Filter trips based on proximity to reference coordinates
for participant, trip in participant_trips.items():
    include_trip = False
    for feature in trip:
        current_coordinates = feature["geometry"]["coordinates"]
        distance_to_reference = haversine(reference_coordinates[0], reference_coordinates[1], current_coordinates[0], current_coordinates[1])
        if distance_to_reference <= 2000:
            include_trip = True
            break
    if include_trip:
        geojson["features"].extend(trip)

# Write the GeoJSON to a file
with open('boschdataset_filtered.geojson', 'w') as outfile:
    json.dump(geojson, outfile, indent=4)