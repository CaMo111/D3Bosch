import json
import math

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

def parse_line(line, prev_coordinates):
    fields = line.strip().split(',')
    
    # Check if the line has the expected number of fields
    if len(fields) < 25:
        return None, prev_coordinates  # Skip lines that do not have enough fields
    
    # Check if the participant is 1, 2, or 3
    if fields[1] in ['1']:
        colour = 'red'
        current_coordinates = [float(fields[8]), float(fields[7])]
        distance = 0
        if prev_coordinates:
            distance = haversine(prev_coordinates[0], prev_coordinates[1], current_coordinates[0], current_coordinates[1])
        
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
                "ModeButton_xs": fields[24] if len(fields) > 24 and fields[24] != 'NA' else None,
                "colour": colour
            },
            "geometry": {
                "type": "Point",
                "coordinates": current_coordinates,
                "distance": distance  # Distance in meters
            }
        }
        return feature, current_coordinates
    return None, prev_coordinates

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

prev_coordinates = None
for line in lines:
    feature, prev_coordinates = parse_line(line, prev_coordinates)
    if feature is not None:
        geojson["features"].append(feature)

# Write to boschdataset_onlyparticipant1.geojson
with open('boschdataset_onlyparticipant1.geojson', 'w') as file:
    json.dump(geojson, file, indent=4)