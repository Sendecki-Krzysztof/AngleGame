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
        # 🕵️‍♂️ Read the local calendar date from the frontend query parameters
        target_date = req.params.get('date')

        # Fallback to server UTC date if the frontend didn't pass one
        if not target_date:
            target_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            logging.info(f"No explicit date query string passed. Defaulting to UTC server time: {target_date}")
        else:
            logging.info(f"Frontend explicitly requested parameter fallback date row: {target_date}")

        table_client = get_table_client()

        try:
            # 🎯 Use the validated target_date to fetch the precise row key
            entity = table_client.get_entity(partition_key="DailyGame", row_key=target_date)
            logging.info(f"Found existing challenge entry in storage for date: {target_date}")
            target_angle = entity["TargetAngle"]
        except ResourceNotFoundError:
            logging.info(f"No challenge found for {target_date}. Generating new entity...")
            valid_angles = [a for a in range(10, 350) if a not in [90, 180, 270]]
            target_angle = random.choice(valid_angles)

            new_challenge = {
                "PartitionKey": "DailyGame",
                "RowKey": target_date,
                "TargetAngle": target_angle,
                "ToleranceHot": 5,
                "ToleranceWarm": 15,
            }
            table_client.create_entity(entity=new_challenge)
            logging.info(f"Successfully saved challenge for {target_date} to database.")

        game_payload = {
            "gameId": target_date,
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