from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine, Base
from src.api.auth import router as auth_router
from src.api.master_data import router as master_router
from src.api.proposals import router as proposal_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Curriculum Revision Management System API",
    description="CS314 Software Development Laboratory - LNMIIT Jaipur. Team T017. Comprehensive curriculum revision workflow and approval platform.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(master_router)
app.include_router(proposal_router)

@app.get("/")
def root():
    return {
        "system": "Curriculum Revision Management System",
        "team": "T017",
        "course": "CS314 - Software Development Laboratory",
        "institution": "The LNM Institute of Information Technology, Jaipur",
        "status": "Online",
        "docs_url": "/docs"
    }
