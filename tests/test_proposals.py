import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def get_auth_token(email='faculty@lnmiit.ac.in', password='Faculty@123'):
    resp = client.post('/api/auth/login', json={'email': email, 'password': password})
    return resp.json()['access_token']

def test_proposal_lifecycle_draft_and_validation():
    token = get_auth_token()
    headers = {'Authorization': f'Bearer {token}'}

    # 1. Create Draft Proposal (FR-009, FR-012)
    create_payload = {
        'proposalType': 'NEW_COURSE',
        'title': 'AI Systems and Architectures',
        'departmentId': 'DEP-CSE',
        'affectedProgrammes': ['PRG-BCSE'],
        'academicRationale': '', # empty to test validation
        'credits': 0,
        'proposedImplementationSession': ''
    }
    create_resp = client.post('/api/proposals', json=create_payload, headers=headers)
    assert create_resp.status_code == 200
    proposal = create_resp.json()
    proposal_id = proposal['proposalId']
    assert proposal['currentStatus'] == 'Draft'
    assert len(proposal['versions']) == 1

    # 2. Attempt submit with missing mandatory fields (FR-015, BR-004)
    submit_fail = client.post(f'/api/proposals/{proposal_id}/submit', headers=headers)
    assert submit_fail.status_code == 400
    assert 'BR-004' in submit_fail.json()['detail']

    # 3. Update Proposal to complete fields (FR-014, BR-003)
    update_payload = {
        'title': 'AI Systems and Architectures',
        'academicRationale': 'Introduce advanced generative and distributed AI concepts for undergraduate students.',
        'prerequisites': 'Data Structures & Algorithms, Computer Architecture',
        'credits': 4,
        'syllabusChangeDescription': 'Full course syllabus covering LLMs, Edge AI, Distributed Training.',
        'resourceImplications': 'GPU compute laboratory infrastructure required.',
        'proposedImplementationSession': 'Odd Semester 2026-27'
    }
    update_resp = client.put(f'/api/proposals/{proposal_id}', json=update_payload, headers=headers)
    assert update_resp.status_code == 200

    # 4. Successful submission (FR-016, BR-005, BR-006)
    submit_resp = client.post(f'/api/proposals/{proposal_id}/submit', headers=headers)
    assert submit_resp.status_code == 200
    sub_data = submit_resp.json()
    assert sub_data['currentStatus'] == 'Submitted / Under Review'
    assert sub_data['currentWorkflowStage'] == 'Department Review'
    assert sub_data['currentResponsibleRole'] == 'Programme Coordinator / HOD'

    # 5. Check version snapshot is sealed immutable (FR-025)
    versions_resp = client.get(f'/api/proposals/{proposal_id}/versions', headers=headers)
    assert versions_resp.status_code == 200
    versions = versions_resp.json()
    assert len(versions) == 1
    assert versions[0]['isImmutable'] == True

    # 6. Attempt editing sealed proposal (BR-003)
    edit_fail = client.put(f'/api/proposals/{proposal_id}', json={'title': 'Altered Title'}, headers=headers)
    assert edit_fail.status_code == 400
    assert 'BR-003' in edit_fail.json()['detail']
