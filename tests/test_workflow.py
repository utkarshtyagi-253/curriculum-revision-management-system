import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def get_auth_token(email, password):
    resp = client.post('/api/auth/login', json={'email': email, 'password': password})
    return resp.json()['access_token']

def test_workflow_review_return_and_resubmit():
    fac_token = get_auth_token('faculty@lnmiit.ac.in', 'Faculty@123')
    hod_token = get_auth_token('hod@lnmiit.ac.in', 'Hod@123')
    fac_headers = {'Authorization': f'Bearer {fac_token}'}
    hod_headers = {'Authorization': f'Bearer {hod_token}'}

    # Create & submit proposal
    create_payload = {
        'proposalType': 'COURSE_MODIFICATION',
        'title': 'Advanced Software Engineering',
        'departmentId': 'DEP-CCE',
        'affectedProgrammes': ['PRG-BCCE'],
        'academicRationale': 'Revise syllabus to include microservices and cloud testing.',
        'prerequisites': 'CS311',
        'credits': 3,
        'syllabusChangeDescription': 'Added CI/CD and Containerization units.',
        'resourceImplications': 'None',
        'proposedImplementationSession': 'Even Semester 2026-27'
    }
    prop = client.post('/api/proposals', json=create_payload, headers=fac_headers).json()
    proposal_id = prop['proposalId']
    client.post(f'/api/proposals/{proposal_id}/submit', headers=fac_headers)

    # 1. HOD review - Return for Revision without reason fails (BR-008)
    fail_review = client.post(f'/api/proposals/{proposal_id}/review', json={
        'actionType': 'Return for Revision',
        'commentReason': ''
    }, headers=hod_headers)
    assert fail_review.status_code == 400
    assert 'BR-008' in fail_review.json()['detail']

    # 2. HOD returns with reason
    return_resp = client.post(f'/api/proposals/{proposal_id}/review', json={
        'actionType': 'Return for Revision',
        'commentReason': 'Please elaborate on evaluation scheme for lab exercises.'
    }, headers=hod_headers)
    assert return_resp.status_code == 200
    assert return_resp.json()['currentStatus'] == 'Returned for Revision'

    # 3. Proposer modifies proposal while returned (BR-003)
    client.put(f'/api/proposals/{proposal_id}', json={
        'academicRationale': 'Updated: Thorough lab exercises and project milestones added.'
    }, headers=fac_headers)

    # 4. Proposer resubmits (FR-023, BR-005) -> should create version 2
    resubmit_resp = client.post(f'/api/proposals/{proposal_id}/submit', headers=fac_headers)
    assert resubmit_resp.status_code == 200
    assert resubmit_resp.json()['currentStatus'] == 'Submitted / Under Review'

    # 5. Version comparison (FR-027)
    versions_resp = client.get(f'/api/proposals/{proposal_id}/versions', headers=fac_headers).json()
    assert len(versions_resp) == 2
    assert versions_resp[0]['versionNo'] == 1
    assert versions_resp[1]['versionNo'] == 2

    comp_resp = client.get(f'/api/proposals/{proposal_id}/compare?versionA=1&versionB=2', headers=fac_headers)
    assert comp_resp.status_code == 200
    changes = comp_resp.json()['changes']
    assert 'academicRationale' in changes
