
def check_and_alert(df, threshold=5):
    holding_count = df[df['holding'] == True].shape[0]
    if holding_count >= threshold:
        # Replace with Slack webhook or SMTP logic
        print(f"⚠ ALERT: {holding_count} aircraft are in holding at Heathrow!")
    else:
        print(f"Holding aircraft: {holding_count} (below threshold)")
