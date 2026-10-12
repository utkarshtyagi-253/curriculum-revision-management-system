import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from src.models import AuditEvent, Notification

def log_audit_event(
    db: Session,
    actor_id: str,
    action: str,
    object_type: str,
    object_id: str,
    result: str = "SUCCESS",
    metadata: dict = None
) -> AuditEvent:
    event = AuditEvent(
        auditId=f"AUD-{uuid.uuid4().hex[:10].upper()}",
        actorId=actor_id,
        action=action,
        objectType=object_type,
        objectId=object_id,
        result=result,
        timestamp=datetime.utcnow(),
        metadataJson=json.dumps(metadata or {})
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def create_notification(
    db: Session,
    recipient_id: str,
    proposal_id: str,
    event_type: str,
    message: str
) -> Notification:
    notif = Notification(
        notificationId=f"NOTIF-{uuid.uuid4().hex[:10].upper()}",
        recipientId=recipient_id,
        proposalId=proposal_id,
        eventType=event_type,
        message=message,
        createdTimestamp=datetime.utcnow(),
        isRead=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
