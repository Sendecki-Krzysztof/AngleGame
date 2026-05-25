import logging
from datetime import datetime, timezone
import hashlib
import azure.functions as func

# 🧼 REMOVE the old get_table_client import line!
# 🎨 Import your blueprint/shared logic or just run the calculation locally
from src.triggers.daily_angle_api import SECRET_SALT

timer_blueprint = func.Blueprint()


@timer_blueprint.timer_trigger(schedule="0 0 0 * * *", arg_name="myTimer", run_on_startup=False, use_monitor=True)
def discord_timer(myTimer: func.TimerRequest) -> None:
    if myTimer.past_due:
        logging.info('The timer is running late!')

    # 🗓️ Get current UTC date string
    target_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 🧩 Match the exact same deterministic math hash sequence your API uses
    seed_string = f"{target_date}-{SECRET_SALT}".encode('utf-8')
    hash_digest = hashlib.sha256(seed_string).hexdigest()
    hash_int = int(hash_digest, 16)

    # Map it to your safe layout array bounds
    valid_angles = [a for a in range(10, 350) if a not in [90, 180, 270]]
    todays_angle = valid_angles[hash_int % len(valid_angles)]

    logging.info(f"Vektor system synced! Today's secret angle is calculated as: {todays_angle}°")

    # Your code down here handles pushing the notification to your Discord webhook...