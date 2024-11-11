# function should seperate all items of a string by a comma into a list
def sep(input):
    return input.split(',')

x = ["Timestamp","Participant","Activity","HR_mad_filtered","HRV","stress_xs","satisfaction_journey_xs","Latitude","Longitude","Gender","Age","Event_Delay_xs","Event_Disturbing_people_xs","Event_Negative_Driving_xs","Event_Infrastructure_xs","Event_Positive_Interaction_xs","Event_Media_Entertainment_xs","Event_Reached_xs","Event_Discomfort_xs","Event_Comfortable_xs","Event_Beautiful_xs","emotion_open_xs","Event_Free_xs","Mode_keepmoving","ModeButton_xs"
]

for items in x:
    print(items)