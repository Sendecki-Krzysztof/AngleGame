import azure.functions as func
from src.triggers.daily_angle_api import api_blueprint
# from src.triggers.discord_timer import timer_blueprint

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

app.register_blueprint(api_blueprint)

# app.register_blueprint(timer_blueprint)