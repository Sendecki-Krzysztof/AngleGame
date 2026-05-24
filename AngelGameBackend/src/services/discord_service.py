import json
import logging
import os
import requests


def send_daily_angle_broadcast(today_str: str, target_angle: int) -> bool:
    """Handles formatting and transmitting the Rich Embed card to the Discord API channel webhooks."""
    webhook_url = os.environ.get("DiscordWebhookUrl")
    if not webhook_url or "YOUR_ACTUAL" in webhook_url:
        logging.error("DiscordWebhookUrl environment setting is missing or unconfigured.")
        return False

    discord_payload = {
        "username": "Angle.wtf Cloud Bot",
        "avatar_url": "https://portal.azure.com/favicon.ico",
        "embeds": [
            {
                "title": "📐 Daily Angle Challenge Is Live! 🏹",
                "description": f"A brand new angle challenge has been deployed for **{today_str}**.\n\nCan you guess the exact measurement of today's visual canvas rotation?",
                "color": 9024442,
                "fields": [
                    {
                        "name": "🎯 System Specs",
                        "value": f"• **Rotation Boundaries:** 1° to 359°\n• **Feedback Mode:** Active Proximity Vectors\n• **Psst... Today's Hint:** ||{target_angle}°||",
                        "inline": False,
                    }
                ],
                "footer": {"text": "Powered by Azure Serverless Modular Microservices"},
            }
        ],
    }

    try:
        response = requests.post(
            webhook_url, data=json.dumps(discord_payload), headers={"Content-Type": "application/json"}, timeout=10
        )
        if response.status_code == 204:
            logging.info("Successfully transmitted daily payload to Discord endpoint infrastructure.")
            return True
        logging.error(f"Discord server responded with non-success code: {response.status_code}")
        return False
    except Exception as ex:
        logging.error(f"Network transport fault during Discord delivery loop: {str(ex)}")
        return False