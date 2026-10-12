import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from datetime import datetime
from src.database import engine, SessionLocal, Base
from src.models import (
    User, Role, UserRole, Department, Programme, Course, Committee,
    WorkflowDefinition, WorkflowStage
)
from src.services.auth_service import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Role).first():
        print('Clearing existing data for clean re-seed...')
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    print('Seeding initial data...')

    roles = [
        Role(roleId='ADMIN', roleName='System Administrator', roleDescription='Full system management'),
        Role(roleId='Faculty Proposer', roleName='Faculty Proposer', roleDescription='Initiates curriculum proposals'),
        Role(roleId='Programme Coordinator / HOD', roleName='Programme Coordinator / HOD', roleDescription='Department level scrutiny'),
        Role(roleId='Department Curriculum Committee', roleName='Department Curriculum Committee', roleDescription='Committee review'),
        Role(roleId='Academic Office', roleName='Academic Office', roleDescription='Process compliance and records'),
        Role(roleId='Senate / Academic Council', roleName='Senate / Academic Council', roleDescription='Final institutional approval'),
    ]
    db.add_all(roles)
    db.commit()

    dept_cse = Department(departmentId='DEP-CSE', departmentName='Computer Science and Engineering', departmentCode='CSE')
    dept_cce = Department(departmentId='DEP-CCE', departmentName='Communication and Computer Engineering', departmentCode='CCE')
    dept_ece = Department(departmentId='DEP-ECE', departmentName='Electronics and Communication Engineering', departmentCode='ECE')
    db.add_all([dept_cse, dept_cce, dept_ece])
    db.commit()

    prog_cse = Programme(programmeId='PRG-BCSE', programmeName='B.Tech Computer Science and Engineering', programmeCode='B.Tech CSE', departmentId='DEP-CSE', degreeLevel='UG')
    prog_cce = Programme(programmeId='PRG-BCCE', programmeName='B.Tech Communication and Computer Engineering', programmeCode='B.Tech CCE', departmentId='DEP-CCE', degreeLevel='UG')
    db.add_all([prog_cse, prog_cce])
    db.commit()

    courses = [
        Course(courseId='CRS-CS314', courseCode='CS314', courseTitle='Software Development Laboratory', credits=2, departmentId='DEP-CSE'),
        Course(courseId='CRS-CS311', courseCode='CS311', courseTitle='Software Engineering', credits=4, departmentId='DEP-CSE'),
        Course(courseId='CRS-CS201', courseCode='CS201', courseTitle='Data Structures and Algorithms', credits=4, departmentId='DEP-CSE')
    ]
    db.add_all(courses)
    db.commit()

    committee = Committee(committeeId='COM-DCC-CSE', committeeName='Department Curriculum Committee - CSE', committeeType='DCC', scope='DEPARTMENT')
    db.add(committee)
    db.commit()

    users_data = [
        ('U-ADMIN', 'System Administrator', 'admin@lnmiit.ac.in', 'Admin@123', 'ADMIN', 'DEP-CSE'),
        ('U-114', 'Dr. Ananya Rao', 'faculty@lnmiit.ac.in', 'Faculty@123', 'Faculty Proposer', 'DEP-CCE'),
        ('U-HOD', 'Dr. Rajesh Sharma', 'hod@lnmiit.ac.in', 'Hod@123', 'Programme Coordinator / HOD', 'DEP-CCE'),
        ('U-DCC', 'Prof. Vikram Mehta', 'dcc@lnmiit.ac.in', 'Dcc@123', 'Department Curriculum Committee', 'DEP-CCE'),
        ('U-ACAD', 'Dr. Sangeeta Verma', 'academics@lnmiit.ac.in', 'Academic@123', 'Academic Office', 'DEP-CSE'),
        ('U-SENATE', 'Prof. Dean Academics', 'senate@lnmiit.ac.in', 'Senate@123', 'Senate / Academic Council', 'DEP-CSE'),
    ]

    for uid, name, email, pwd, role_id, dept_id in users_data:
        user = User(
            userId=uid,
            name=name,
            email=email,
            passwordHash=get_password_hash(pwd),
            department=dept_id,
            accountStatus='ACTIVE'
        )
        db.add(user)
        db.commit()

        user_role = UserRole(userId=uid, roleId=role_id, assignedBy='SYSTEM', isActive=True)
        db.add(user_role)
        db.commit()

    workflow = WorkflowDefinition(
        workflowId='WF-01',
        workflowName='Standard Curriculum Revision Workflow',
        proposalTypeScope='ALL',
        isActive=True,
        version='1.0'
    )
    db.add(workflow)
    db.commit()

    stages = [
        WorkflowStage(stageId='ST-01', workflowId='WF-01', stageSequence=1, stageName='Department Review', responsibleRole='Programme Coordinator / HOD', permittedActions=json.dumps(['Recommend', 'Return for Revision']), mandatoryFlag=True),
        WorkflowStage(stageId='ST-02', workflowId='WF-01', stageSequence=2, stageName='DCC / BOS Review', responsibleRole='Department Curriculum Committee', permittedActions=json.dumps(['Recommend', 'Return for Revision', 'Reject']), mandatoryFlag=True),
        WorkflowStage(stageId='ST-03', workflowId='WF-01', stageSequence=3, stageName='Academic Office Scrutiny', responsibleRole='Academic Office', permittedActions=json.dumps(['Recommend', 'Return for Revision']), mandatoryFlag=True),
        WorkflowStage(stageId='ST-04', workflowId='WF-01', stageSequence=4, stageName='Senate Approval', responsibleRole='Senate / Academic Council', permittedActions=json.dumps(['Final Approval', 'Conditional Approval', 'Reject']), mandatoryFlag=True),
    ]
    db.add_all(stages)
    db.commit()

    print('Database seeding completed successfully.')
    db.close()

if __name__ == '__main__':
    seed()
