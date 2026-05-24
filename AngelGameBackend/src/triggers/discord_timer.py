import logging
from datetime import datetime, timezone
import azure.functions as func
from azure.core.exceptions import ResourceNotFoundError

# Import the shared database connector from our cousin API file
from src.services.discord_service import send_daily_angle_broadcast
from src.triggers.daily_angle_api import get_table_client

# Create our Timer Blueprint instance
timer_blueprint = func.Blueprint()

# CRON Expression: "0 0 0 * * *" runs exactly once a day at midnight (00:00:00) UTC
@timer_blueprint.timer_trigger(schedule="0 0 0 * * *", arg_name="myTimer", run_on_startup=True)
def DailyDiscordBroadcast(myTimer: func.TimerRequest) -> None:
    logging.info("Timer trigger activated. Polling database storage account.")

    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        table_client = get_table_client()

        try:
            entity = table_client.get_entity(partition_key="DailyGame", row_key=today_str)
            target_angle = entity["TargetAngle"]
        except ResourceNotFoundError:
            logging.warning("No angle entry found in storage for today yet. Skipping broadcast slot.")
            return

        # Fire off our pure execution service
        send_daily_angle_broadcast(today_str, target_angle)

    except Exception as e:
        logging.error(f"Failed execution cycle inside Discord Broadcaster trigger: {str(e)}")