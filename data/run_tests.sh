# NOTE: Make sure to run this in the venv terminal
python3 -m coverage run -m pytest --cov-report html --cov=jobs/src jobs/tests/*.py;
open -a 'Google Chrome' htmlcov/index.html;