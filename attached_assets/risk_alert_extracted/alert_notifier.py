
import requests
import os

SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL")

def send_entry_risk_alert(flight, destination, flagged_nats):
    if not SLACK_WEBHOOK:
        print("No webhook configured.")
        return

    message = {
        "text": f"✈️ *[ALERT] Entry Risk: {destination}*\n"
                f"Flight: {flight}\n"
                f"Flagged nationalities: {', '.join(set(flagged_nats))}\n"
                f"Consider alternate airport.\n"
    }

    response = requests.post(SLACK_WEBHOOK, json=message)
    print(f"Slack response: {response.status_code}")
