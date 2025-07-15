import axios from "axios";

export const sendStandConflictAlert = async (conflictInfo: any) => {
  const message = \`🚨 Stand Conflict: Flight \${conflictInfo.previousFlightId} occupying gate \${conflictInfo.gate}. ETA delay: \${conflictInfo.waitTime} min.\`;

  try {
    await axios.post("https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK", {
      text: message,
    });
    console.log("Alert sent successfully");
  } catch (error) {
    console.error("Error sending alert:", error);
  }
};