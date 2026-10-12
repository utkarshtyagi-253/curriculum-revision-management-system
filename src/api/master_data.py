from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import Department, Programme, Course, Committee, WorkflowDefinition

router = APIRouter(prefix="/api/master", tags=["Master Data"])

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.isActive == True).all()

@router.get("/programmes")
def get_programmes(db: Session = Depends(get_db)):
    return db.query(Programme).filter(Programme.isActive == True).all()

@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.get("/committees")
def get_committees(db: Session = Depends(get_db)):
    return db.query(Committee).filter(Committee.isActive == True).all()

@router.get("/workflows")
def get_workflows(db: Session = Depends(get_db)):
    return db.query(WorkflowDefinition).filter(WorkflowDefinition.isActive == True).all()
