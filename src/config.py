import os

SECRET_KEY = os.getenv("SECRET_KEY", "cs314-curriculum-revision-system-t017")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./curriculum_revision.db")
