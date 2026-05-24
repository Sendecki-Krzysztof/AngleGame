import azure.functions as func

# 1. Initialize the Core Azure Application Container
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# 2. Import your Blueprint Routers from the src tree
from src.triggers.daily_angle_api import api_blueprint
from src.triggers.discord_timer import timer_blueprint

# 3. Mount them directly into the runtime engine
app.register_blueprint(api_blueprint)
app.register_blueprint(timer_blueprint)