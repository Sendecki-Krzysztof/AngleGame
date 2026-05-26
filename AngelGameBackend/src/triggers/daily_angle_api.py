import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
import azure.functions as func

api_blueprint = func.Blueprint()

SECRET_SALT = "VektorSuperSecretSaltKey2026"

@api_blueprint.route(route="GetDailyAngle", methods=["GET"])
def GetDailyAngle(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Calculating deterministic daily angle.")

    central_standard_time = datetime.now(ZoneInfo("America/Chicago"))
    timezone
    try:
        # Read the target date parameter (or fall back to server UTC)
        target_date = req.params.get('date')
        if not target_date:
            target_date = central_standard_time.strftime("%Y-%m-%d")

        seed_string = f"{target_date}-{SECRET_SALT}".encode('utf-8')
        hash_digest = hashlib.sha256(seed_string).hexdigest()
        hash_int = int(hash_digest, 16)
        valid_angles = [a for a in range(10, 350) if a not in [90, 180, 270]]
        target_angle = valid_angles[hash_int % len(valid_angles)]
        game_payload = {
            "gameId": target_date,
            "targetAngle": target_angle,
            "status": "success",
        }

        return func.HttpResponse(body=json.dumps(game_payload), mimetype="application/json", status_code=200)

    except Exception as e:
        logging.error(f"Global math error: {str(e)}")
        return func.HttpResponse(
            body=json.dumps({"error": "Backend failed to compute math state."}),
            mimetype="application/json",
            status_code=500,
        )