from datetime import date, datetime

from models import (
    Ministry,
    ScheduleSlot,
    ServiceSchedule,
    SlotAssignment,
    User,
    db,
)
from services.ministries_auth import user_belongs_to_ministry, user_can_manage_ministry
from services.ministries_service import _serialize_ministry

SCHEDULE_STATUS_DRAFT = 'draft'
SCHEDULE_STATUS_PUBLISHED = 'published'
SCHEDULE_STATUS_ARCHIVED = 'archived'
VALID_SCHEDULE_STATUSES = (
    SCHEDULE_STATUS_DRAFT,
    SCHEDULE_STATUS_PUBLISHED,
    SCHEDULE_STATUS_ARCHIVED,
)

ASSIGNMENT_STATUS_ASSIGNED = 'assigned'
ASSIGNMENT_STATUS_CONFIRMED = 'confirmed'
ASSIGNMENT_STATUS_DECLINED = 'declined'
ASSIGNMENT_STATUS_REPLACED = 'replaced'
VALID_ASSIGNMENT_STATUSES = (
    ASSIGNMENT_STATUS_ASSIGNED,
    ASSIGNMENT_STATUS_CONFIRMED,
    ASSIGNMENT_STATUS_DECLINED,
    ASSIGNMENT_STATUS_REPLACED,
)
VOLUNTEER_ASSIGNMENT_STATUSES = (ASSIGNMENT_STATUS_CONFIRMED, ASSIGNMENT_STATUS_DECLINED)


def _parse_date(value):
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    return date.fromisoformat(str(value))


def _parse_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value)
    if text.endswith('Z'):
        text = text[:-1] + '+00:00'
    return datetime.fromisoformat(text)


def _serialize_assignment(assignment):
    user = assignment.user
    return {
        'id': assignment.id,
        'slotId': assignment.slot_id,
        'userId': assignment.user_id,
        'username': user.username,
        'fullName': user.full_name,
        'status': assignment.status,
        'assignedAt': assignment.assigned_at.isoformat() if assignment.assigned_at else None,
    }


def _serialize_slot(slot, *, include_assignments=True):
    data = {
        'id': slot.id,
        'scheduleId': slot.schedule_id,
        'title': slot.title,
        'roleLabel': slot.role_label,
        'startsAt': slot.starts_at.isoformat() if slot.starts_at else None,
        'endsAt': slot.ends_at.isoformat() if slot.ends_at else None,
        'location': slot.location or '',
        'notes': slot.notes or '',
    }
    if include_assignments:
        data['assignments'] = [
            _serialize_assignment(a) for a in slot.assignments
        ]
    return data


def _serialize_schedule(schedule, *, include_slots=False):
    data = {
        'id': schedule.id,
        'ministryId': schedule.ministry_id,
        'title': schedule.title,
        'startDate': schedule.start_date.isoformat() if schedule.start_date else None,
        'endDate': schedule.end_date.isoformat() if schedule.end_date else None,
        'status': schedule.status,
        'createdById': schedule.created_by_id,
        'createdAt': schedule.created_at.isoformat() if schedule.created_at else None,
        'updatedAt': schedule.updated_at.isoformat() if schedule.updated_at else None,
    }
    if include_slots:
        data['slots'] = [_serialize_slot(s) for s in schedule.slots]
    return data


def _get_schedule(schedule_id):
    return ServiceSchedule.query.get(schedule_id)


def _get_slot(slot_id):
    return ScheduleSlot.query.get(slot_id)


def get_slot(slot_id):
    slot = _get_slot(slot_id)
    if not slot:
        return {'error': 'Slot not found', 'code': 404}
    return {'slot': _serialize_slot(slot)}


def check_slot_access(slot_id, user_id, *, is_admin=False):
    slot = _get_slot(slot_id)
    if not slot:
        return None, {'error': 'Slot not found', 'code': 404}
    schedule, error = check_schedule_access(
        slot.schedule_id, user_id, is_admin=is_admin
    )
    if error:
        return None, error
    return slot, None


def _validate_schedule_dates(start_date, end_date):
    if start_date > end_date:
        return {'error': 'startDate must be on or before endDate', 'code': 400}
    return None


def _validate_slot_times(starts_at, ends_at, schedule):
    if starts_at >= ends_at:
        return {'error': 'startsAt must be before endsAt', 'code': 400}
    if schedule.start_date and starts_at.date() < schedule.start_date:
        return {'error': 'slot starts before schedule period', 'code': 400}
    if schedule.end_date and ends_at.date() > schedule.end_date:
        return {'error': 'slot ends after schedule period', 'code': 400}
    return None


def _user_can_view_schedule(schedule, user_id, *, is_admin=False, can_manage=False):
    if is_admin or can_manage:
        return True
    if schedule.status == SCHEDULE_STATUS_DRAFT:
        return False
    return user_belongs_to_ministry(user_id, schedule.ministry_id)


def _schedule_is_editable(schedule):
    return schedule.status == SCHEDULE_STATUS_DRAFT


def _has_assignment_overlap(user_id, starts_at, ends_at, exclude_slot_id=None):
    query = (
        SlotAssignment.query.join(ScheduleSlot)
        .join(ServiceSchedule)
        .filter(
            SlotAssignment.user_id == user_id,
            ServiceSchedule.status.in_([SCHEDULE_STATUS_DRAFT, SCHEDULE_STATUS_PUBLISHED]),
            ScheduleSlot.starts_at < ends_at,
            ScheduleSlot.ends_at > starts_at,
        )
    )
    if exclude_slot_id is not None:
        query = query.filter(ScheduleSlot.id != exclude_slot_id)
    return query.first() is not None


def list_ministry_schedules(
    ministry_id,
    *,
    user_id,
    is_admin=False,
    status=None,
):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}

    can_manage = user_can_manage_ministry(user_id, ministry_id, is_admin=is_admin)
    if not can_manage and not user_belongs_to_ministry(user_id, ministry_id):
        return {'error': 'Forbidden', 'code': 403}

    query = ServiceSchedule.query.filter_by(ministry_id=ministry_id).order_by(
        ServiceSchedule.start_date.desc()
    )
    if status:
        query = query.filter(ServiceSchedule.status == status)
    elif not can_manage and not is_admin:
        query = query.filter(
            ServiceSchedule.status.in_(
                [SCHEDULE_STATUS_PUBLISHED, SCHEDULE_STATUS_ARCHIVED]
            )
        )

    schedules = query.all()
    return {'ministry': _serialize_ministry(ministry), 'schedules': [_serialize_schedule(s) for s in schedules]}


def create_schedule(ministry_id, created_by_id, title, start_date, end_date):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}

    title = (title or '').strip()
    if not title:
        return {'error': 'title is required', 'code': 400}

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    if not start or not end:
        return {'error': 'startDate and endDate are required', 'code': 400}

    date_error = _validate_schedule_dates(start, end)
    if date_error:
        return date_error

    schedule = ServiceSchedule(
        ministry_id=ministry_id,
        title=title,
        start_date=start,
        end_date=end,
        status=SCHEDULE_STATUS_DRAFT,
        created_by_id=created_by_id,
    )
    db.session.add(schedule)
    db.session.commit()
    return {'schedule': _serialize_schedule(schedule)}


def get_schedule(schedule_id, *, include_slots=False):
    schedule = _get_schedule(schedule_id)
    if not schedule:
        return {'error': 'Schedule not found', 'code': 404}
    return {
        'schedule': _serialize_schedule(schedule, include_slots=include_slots),
    }


def update_schedule(schedule_id, data):
    schedule = _get_schedule(schedule_id)
    if not schedule:
        return {'error': 'Schedule not found', 'code': 404}
    if not _schedule_is_editable(schedule):
        return {'error': 'Only draft schedules can be edited', 'code': 400}

    if 'title' in data and data['title'] is not None:
        title = data['title'].strip()
        if not title:
            return {'error': 'title cannot be empty', 'code': 400}
        schedule.title = title

    start = schedule.start_date
    end = schedule.end_date
    if 'startDate' in data and data['startDate'] is not None:
        start = _parse_date(data['startDate'])
    if 'endDate' in data and data['endDate'] is not None:
        end = _parse_date(data['endDate'])

    date_error = _validate_schedule_dates(start, end)
    if date_error:
        return date_error

    schedule.start_date = start
    schedule.end_date = end
    db.session.commit()
    return {'schedule': _serialize_schedule(schedule)}


def publish_schedule(schedule_id):
    schedule = _get_schedule(schedule_id)
    if not schedule:
        return {'error': 'Schedule not found', 'code': 404}
    if schedule.status != SCHEDULE_STATUS_DRAFT:
        return {'error': 'Only draft schedules can be published', 'code': 400}
    if not schedule.slots:
        return {'error': 'Cannot publish a schedule without slots', 'code': 400}

    schedule.status = SCHEDULE_STATUS_PUBLISHED
    db.session.commit()
    return {'schedule': _serialize_schedule(schedule, include_slots=True)}


def archive_schedule(schedule_id):
    schedule = _get_schedule(schedule_id)
    if not schedule:
        return {'error': 'Schedule not found', 'code': 404}
    if schedule.status != SCHEDULE_STATUS_PUBLISHED:
        return {'error': 'Only published schedules can be archived', 'code': 400}

    schedule.status = SCHEDULE_STATUS_ARCHIVED
    db.session.commit()
    return {'schedule': _serialize_schedule(schedule)}


def create_slot(schedule_id, data):
    schedule = _get_schedule(schedule_id)
    if not schedule:
        return {'error': 'Schedule not found', 'code': 404}
    if not _schedule_is_editable(schedule):
        return {'error': 'Slots can only be added to draft schedules', 'code': 400}

    title = (data.get('title') or '').strip()
    if not title:
        return {'error': 'title is required', 'code': 400}

    starts_at = _parse_datetime(data.get('startsAt'))
    ends_at = _parse_datetime(data.get('endsAt'))
    if not starts_at or not ends_at:
        return {'error': 'startsAt and endsAt are required', 'code': 400}

    time_error = _validate_slot_times(starts_at, ends_at, schedule)
    if time_error:
        return time_error

    slot = ScheduleSlot(
        schedule_id=schedule_id,
        title=title,
        role_label=(data.get('roleLabel') or '').strip(),
        starts_at=starts_at,
        ends_at=ends_at,
        location=(data.get('location') or '').strip(),
        notes=(data.get('notes') or '').strip(),
    )
    db.session.add(slot)
    db.session.commit()
    return {'slot': _serialize_slot(slot)}


def update_slot(slot_id, data):
    slot = _get_slot(slot_id)
    if not slot:
        return {'error': 'Slot not found', 'code': 404}
    if not _schedule_is_editable(slot.schedule):
        return {'error': 'Slots can only be edited on draft schedules', 'code': 400}

    if 'title' in data and data['title'] is not None:
        title = data['title'].strip()
        if not title:
            return {'error': 'title cannot be empty', 'code': 400}
        slot.title = title

    if 'roleLabel' in data and data['roleLabel'] is not None:
        slot.role_label = data['roleLabel'].strip()

    starts_at = slot.starts_at
    ends_at = slot.ends_at
    if 'startsAt' in data and data['startsAt'] is not None:
        starts_at = _parse_datetime(data['startsAt'])
    if 'endsAt' in data and data['endsAt'] is not None:
        ends_at = _parse_datetime(data['endsAt'])

    time_error = _validate_slot_times(starts_at, ends_at, slot.schedule)
    if time_error:
        return time_error

    slot.starts_at = starts_at
    slot.ends_at = ends_at

    if 'location' in data and data['location'] is not None:
        slot.location = data['location'].strip()
    if 'notes' in data and data['notes'] is not None:
        slot.notes = data['notes'].strip()

    db.session.commit()
    return {'slot': _serialize_slot(slot)}


def delete_slot(slot_id):
    slot = _get_slot(slot_id)
    if not slot:
        return {'error': 'Slot not found', 'code': 404}
    if not _schedule_is_editable(slot.schedule):
        return {'error': 'Slots can only be deleted from draft schedules', 'code': 400}

    db.session.delete(slot)
    db.session.commit()
    return {'message': 'Slot deleted'}


def add_slot_assignment(slot_id, username):
    slot = _get_slot(slot_id)
    if not slot:
        return {'error': 'Slot not found', 'code': 404}
    schedule = slot.schedule
    if schedule.status not in (SCHEDULE_STATUS_DRAFT, SCHEDULE_STATUS_PUBLISHED):
        return {'error': 'Assignments cannot be changed on archived schedules', 'code': 400}

    username = (username or '').strip()
    if not username:
        return {'error': 'username is required', 'code': 400}

    user = User.query.filter_by(username=username).first()
    if not user:
        return {'error': 'User not found', 'code': 404}
    if not user.is_active:
        return {'error': 'User is inactive', 'code': 400}
    if not user_belongs_to_ministry(user.id, schedule.ministry_id):
        return {'error': 'User is not a member of this ministry', 'code': 400}

    existing = SlotAssignment.query.filter_by(slot_id=slot_id, user_id=user.id).first()
    if existing:
        return {'error': 'User is already assigned to this slot', 'code': 409}

    if _has_assignment_overlap(user.id, slot.starts_at, slot.ends_at, exclude_slot_id=slot_id):
        return {
            'error': 'User has a conflicting assignment at this time',
            'code': 409,
        }

    assignment = SlotAssignment(
        slot_id=slot_id,
        user_id=user.id,
        status=ASSIGNMENT_STATUS_ASSIGNED,
        assigned_at=datetime.utcnow(),
    )
    db.session.add(assignment)
    db.session.commit()
    return {'assignment': _serialize_assignment(assignment)}


def remove_slot_assignment(slot_id, user_id):
    slot = _get_slot(slot_id)
    if not slot:
        return {'error': 'Slot not found', 'code': 404}
    schedule = slot.schedule
    if schedule.status not in (SCHEDULE_STATUS_DRAFT, SCHEDULE_STATUS_PUBLISHED):
        return {'error': 'Assignments cannot be changed on archived schedules', 'code': 400}

    assignment = SlotAssignment.query.filter_by(slot_id=slot_id, user_id=user_id).first()
    if not assignment:
        return {'error': 'Assignment not found', 'code': 404}

    db.session.delete(assignment)
    db.session.commit()
    return {'message': 'Assignment removed'}


def update_assignment_status(assignment_id, user_id, status):
    assignment = SlotAssignment.query.get(assignment_id)
    if not assignment:
        return {'error': 'Assignment not found', 'code': 404}
    if assignment.user_id != user_id:
        return {'error': 'Forbidden', 'code': 403}
    if assignment.slot.schedule.status != SCHEDULE_STATUS_PUBLISHED:
        return {'error': 'Assignments can only be confirmed on published schedules', 'code': 400}
    if status not in VOLUNTEER_ASSIGNMENT_STATUSES:
        return {
            'error': f'status must be one of: {", ".join(VOLUNTEER_ASSIGNMENT_STATUSES)}',
            'code': 400,
        }

    assignment.status = status
    db.session.commit()
    return {'assignment': _serialize_assignment(assignment)}


def list_my_assignments(user_id, *, status=None):
    query = (
        SlotAssignment.query.filter_by(user_id=user_id)
        .join(ScheduleSlot)
        .join(ServiceSchedule)
        .filter(ServiceSchedule.status == SCHEDULE_STATUS_PUBLISHED)
        .order_by(ScheduleSlot.starts_at)
    )
    if status:
        query = query.filter(SlotAssignment.status == status)

    results = []
    for assignment in query.all():
        slot = assignment.slot
        schedule = slot.schedule
        results.append({
            'assignment': _serialize_assignment(assignment),
            'slot': _serialize_slot(slot, include_assignments=False),
            'schedule': _serialize_schedule(schedule, include_slots=False),
        })
    return {'assignments': results}


def check_schedule_access(schedule_id, user_id, *, is_admin=False):
    schedule = _get_schedule(schedule_id)
    if not schedule:
        return None, {'error': 'Schedule not found', 'code': 404}

    can_manage = user_can_manage_ministry(
        user_id, schedule.ministry_id, is_admin=is_admin
    )
    if not _user_can_view_schedule(
        schedule, user_id, is_admin=is_admin, can_manage=can_manage
    ):
        return schedule, {'error': 'Forbidden', 'code': 403}
    return schedule, None
