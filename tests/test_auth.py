import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_login_success():
    response = client.post('/api/auth/login', json={
        'email': 'faculty@lnmiit.ac.in',
        'password': 'Faculty@123'
    })
    assert response.status_code == 200
    data = response.json()
    assert 'access_token' == 'access_token' in data or 'access_token' in data
    assert data['userId'] == 'U-114'
    assert 'Faculty Proposer' in data['roles']

def test_login_failure_obscured():
    # FR-002: Notification without revealing whether email or password was wrong
    response = client.post('/api/auth/login', json={
        'email': 'faculty@lnmiit.ac.in',
        'password': 'WrongPassword'
    })
    assert response.status_code == 401
    assert 'Invalid email or password' in response.json()['detail']
