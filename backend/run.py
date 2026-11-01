import os
import sys

# Ensure backend directory is in python sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.utils.seed_data import seed_demo_data

app = create_app()

if app.config.get('AUTO_CREATE_SCHEMA'):
    with app.app_context():
        seed_demo_data()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
