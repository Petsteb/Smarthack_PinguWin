from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func
import uuid

from app.database import Base


class AuditLog(Base):
    """Audit log model - tracks all important actions"""

    __tablename__ = "audit_logs"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who performed the action
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_email = Column(String(255), nullable=True)  # Store email in case user is deleted

    # Action details
    action = Column(String(100), nullable=False, index=True)
    # Examples: "booking_created", "booking_cancelled", "user_updated", "room_deleted"

    resource_type = Column(String(50), nullable=True, index=True)
    # Examples: "booking", "user", "room", "desk"

    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Details
    description = Column(Text, nullable=True)
    changes = Column(JSONB, default=dict, nullable=False)
    # Example: {"field": "status", "old_value": "pending", "new_value": "confirmed"}

    # Request context
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String(500), nullable=True)
    request_id = Column(String(100), nullable=True)

    # Additional metadata
    extra_data = Column(JSONB, default=dict, nullable=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Indexes for performance
    __table_args__ = (
        Index("ix_audit_logs_user_action", "user_id", "action"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
        Index("ix_audit_logs_created", "created_at"),
    )

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_email}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "user_email": self.user_email,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id) if self.resource_id else None,
            "description": self.description,
            "changes": self.changes,
            "ip_address": str(self.ip_address) if self.ip_address else None,
            "user_agent": self.user_agent,
            "request_id": self.request_id,
            "extra_data": self.extra_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
