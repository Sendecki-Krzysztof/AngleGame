import json
import logging
import random
from datetime import datetime, timezone
import azure.functions as func
from azure.core.exceptions import ResourceNotFoundError
from azure.data.tables import TableServiceClient

# Use development storage connection string
CONNECTION_STRING = "UseDevelopmentStorage=true"
TABLE_NAME = "DailyAngles"

# Create our API Blueprint instance
api_blueprint = func.Blueprint()


def get_table_client():
    table_service_client = TableServiceClient.from_connection_string(conn_str=CONNECTION_STRING)
    return table_service_client.create_table_if_not_exists(table_name=TABLE_NAME)


@api_blueprint.route(route="GetDailyAngle", methods=["GET"])
def GetDailyAngle(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Processing a request for the daily angle challenge.")

    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        table_client = get_table_client()

        try:
            entity = table_client.get_entity(partition_key="DailyGame", row_key=today_str)
            logging.info("Found existing challenge entry in storage.")
            target_angle = entity["TargetAngle"]
        except ResourceNotFoundError:
            logging.info("No challenge found for today. Generating new entity...")
            valid_angles = [a for a in range(10, 350) if a not in [90, 180, 270]]
            target_angle = random.choice(valid_angles)

            new_challenge = {
                "PartitionKey": "DailyGame",
                "RowKey": today_str,
                "TargetAngle": target_angle,
                "ToleranceHot": 5,
                "ToleranceWarm": 15,
            }
            table_client.create_entity(entity=new_challenge)
            logging.info(f"Successfully saved challenge for {today_str} to database.")

        game_payload = {
            "gameId": today_str,
            "targetAngle": target_angle,
            "tolerances": {"hot": 5, "warm": 15},
            "status": "success",
        }

        return func.HttpResponse(body=json.dumps(game_payload), mimetype="application/json", status_code=200)

    except Exception as e:
        logging.error(f"Global server error: {str(e)}")
        return func.HttpResponse(
            body=json.dumps({"error": "Backend failed to process state storage."}),
            mimetype="application/json",
            status_code=500,
        )