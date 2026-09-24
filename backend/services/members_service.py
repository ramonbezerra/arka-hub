from datetime import date
import bcrypt
from sqlalchemy import or_
from models import Member, Address, db

_ADDRESS_FIELD_MAP = {
    'address': 'address',
    'city': 'city',
    'state': 'state',
    'country': 'country',
    'postalCode': 'postal_code',
}
_REQUIRED_ADDRESS_KEYS = tuple(_ADDRESS_FIELD_MAP.keys())


def _apply_address_update(member, data):
    """Update an existing address or create one when all required fields are provided."""
    if member.addresses:
        addr = member.addresses[0]
        for data_key, column in _ADDRESS_FIELD_MAP.items():
            if data_key in data and data[data_key] is not None:
                setattr(addr, column, data[data_key])
    elif all(data.get(k) for k in _REQUIRED_ADDRESS_KEYS):
        db.session.add(
            Address(
                user_id=member.id,
                address=data['address'],
                city=data['city'],
                state=data['state'],
                country=data['country'],
                postal_code=data['postalCode'],
            )
        )


def list_members(page=1, per_page=10, show_inactive=False, search='', filters=None):
    """
    Retrieve paginated list of members.
    Returns dict with members data and pagination info.
    """
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:
        per_page = 10

    query = Member.query.order_by(Member.full_name)
    if not show_inactive:
        query = query.filter(Member.is_active == True)

    search_text = (search or '').strip()
    if search_text:
        pattern = f"%{search_text}%"
        filters_list = [
            Member.username.ilike(pattern),
            Member.full_name.ilike(pattern),
            Member.email.ilike(pattern),
            Member.phone.ilike(pattern),
            Member.cpf.ilike(pattern),
            Member.gender.ilike(pattern),
            Member.service_preferences.ilike(pattern)
        ]
        if search_text.lower() == 'active':
            filters_list.append(Member.is_active == True)
        elif search_text.lower() == 'inactive':
            filters_list.append(Member.is_active == False)
        query = query.filter(or_(*filters_list))

    if filters:
        if filters.get('username'):
            query = query.filter(Member.username.ilike(f"%{filters['username']}%"))
        if filters.get('fullname'):
            query = query.filter(Member.full_name.ilike(f"%{filters['fullname']}%"))
        if filters.get('email'):
            query = query.filter(Member.email.ilike(f"%{filters['email']}%"))
        if filters.get('phone'):
            query = query.filter(Member.phone.ilike(f"%{filters['phone']}%"))
        if filters.get('cpf'):
            query = query.filter(Member.cpf.ilike(f"%{filters['cpf']}%"))
        
        # Handle multiple gender values (comma-separated)
        if filters.get('gender'):
            gender_values = [g.strip() for g in filters['gender'].split(',') if g.strip()]
            if gender_values:
                gender_filters = [Member.gender.ilike(f"%{g}%") for g in gender_values]
                query = query.filter(or_(*gender_filters))
        
        # Handle multiple service preferences (comma-separated)
        if filters.get('servicePreferences'):
            pref_values = [p.strip() for p in filters['servicePreferences'].split(',') if p.strip()]
            if pref_values:
                pref_filters = [Member.service_preferences.ilike(f"%{p}%") for p in pref_values]
                query = query.filter(or_(*pref_filters))
        
        # Handle multiple status values (comma-separated)
        if filters.get('status'):
            status_values = [s.strip() for s in filters['status'].split(',') if s.strip()]
            if status_values:
                status_filters = []
                for status_val in status_values:
                    if status_val == 'active':
                        status_filters.append(Member.is_active == True)
                    elif status_val == 'inactive':
                        status_filters.append(Member.is_active == False)
                if status_filters:
                    query = query.filter(or_(*status_filters))

    if filters and filters.get('dateOfBirth'):
        try:
            dob = date.fromisoformat(filters['dateOfBirth'])
            query = query.filter(Member.date_of_birth == dob)
        except ValueError:
            pass  # ignore invalid date format

    paginated_members = query.paginate(page=page, per_page=per_page, error_out=False)

    data = [{
        'username': member.username,
        'fullname': member.full_name,
        'email': member.email,
        'phone': member.phone,
        'cpf': member.cpf,
        'gender': member.gender,
        'dateOfBirth': member.date_of_birth.isoformat() if member.date_of_birth else None,
        'servicePreferences': member.service_preferences.split(',') if member.service_preferences else [],
        'isActive': member.is_active
    } for member in paginated_members.items]
    
    return {
        'members': data,
        'pagination': {
            'total': paginated_members.total,
            'pages': paginated_members.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': paginated_members.has_next,
            'has_prev': paginated_members.has_prev
        }
    }


def enroll_member(username, email, password, fullname='', phone='', cpf=None, 
                  gender='', service_preferences=None, address_data=None):
    """
    Create and enroll a new member.
    Returns dict with status and member info or error message.
    """
    if not username or not email or not password:
        return {'error': 'username, email and password are required', 'code': 400}

    for field, limit in {'username': 80, 'email': 120, 'fullname': 120, 'phone': 20, 'cpf': 11, 'gender': 10}.items():
        value = locals().get(field)
        if value and len(str(value)) > limit:
            return {'error': f'{field} must be at most {limit} characters', 'code': 400}

    if Member.query.filter_by(username=username).first() or Member.query.filter_by(email=email).first():
        return {'error': 'Member with that username or email already exists', 'code': 409}

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    service_prefs_str = ''
    if service_preferences:
        if isinstance(service_preferences, list):
            service_prefs_str = ','.join(service_preferences)
        else:
            service_prefs_str = service_preferences
    
    member = Member(
        username=username,
        email=email,
        password=hashed_password,
        role='member',
        full_name=fullname,
        phone=phone,
        cpf=cpf,
        gender=gender,
        service_preferences=service_prefs_str
    )
    db.session.add(member)
    db.session.flush()

    if address_data and all(address_data.get(k) for k in ['address', 'city', 'state', 'country', 'postalCode']):
        address = Address(
            user_id=member.id,
            address=address_data.get('address'),
            city=address_data.get('city'),
            state=address_data.get('state'),
            country=address_data.get('country'),
            postal_code=address_data.get('postalCode')
        )
        db.session.add(address)

    db.session.commit()
    return {'message': 'Member enrolled successfully', 'username': member.username}


def get_member(username):
    """
    Retrieve member details by username.
    Returns dict with member data or error message.
    """
    member = Member.query.filter_by(username=username).first()
    if not member:
        return {'error': 'Member not found', 'code': 404}

    address = member.addresses[0] if member.addresses else None
    return {
        'member': {
            'username': member.username,
            'fullname': member.full_name,
            'email': member.email,
            'phone': member.phone,
            'cpf': member.cpf,
            'gender': member.gender,
            'dateOfBirth': member.date_of_birth.isoformat() if member.date_of_birth else None,
            'servicePreferences': member.service_preferences.split(',') if member.service_preferences else [],
            'address': address.address if address else None,
            'city': address.city if address else None,
            'state': address.state if address else None,
            'country': address.country if address else None,
            'postalCode': address.postal_code if address else None
        }
    }


def update_member(username, data):
    """
    Update member details by username (admin operation).
    Returns dict with status or error message.
    """
    member = Member.query.filter_by(username=username).first()
    if not member:
        return {'error': 'Member not found', 'code': 404}

    member.full_name = data.get('fullname', member.full_name)
    member.email = data.get('email', member.email)
    member.phone = data.get('phone', member.phone)

    date_of_birth = data.get('dateOfBirth')
    if date_of_birth:
        member.date_of_birth = date.fromisoformat(date_of_birth) if isinstance(date_of_birth, str) else date_of_birth

    member.cpf = data.get('cpf', member.cpf)
    
    service_preferences = data.get('servicePreferences')
    if service_preferences is not None:
        if isinstance(service_preferences, list):
            member.service_preferences = ','.join(service_preferences)
        else:
            member.service_preferences = service_preferences
    
    member.gender = data.get('gender', member.gender)

    password = data.get('password')
    if password:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        member.password = hashed_password

    _apply_address_update(member, data)

    db.session.commit()
    return {'message': 'Member updated successfully'}


def get_member_profile(username):
    """
    Retrieve member profile information.
    Returns dict with profile data or error message.
    """
    member = Member.query.filter_by(username=username).first()
    if not member:
        return {'error': 'Member not found', 'code': 404}

    address = member.addresses[0] if member.addresses else None
    return {
        'username': member.username,
        'fullname': member.full_name,
        'email': member.email,
        'phone': member.phone,
        'dateOfBirth': member.date_of_birth.isoformat() if member.date_of_birth else None,
        'cpf': member.cpf,
        'servicePreferences': member.service_preferences.split(',') if member.service_preferences else [],
        'gender': member.gender,
        'address': address.address if address else None,
        'city': address.city if address else None,
        'state': address.state if address else None,
        'country': address.country if address else None,
        'postalCode': address.postal_code if address else None
    }


def update_member_info(username, data):
    """
    Update member profile information.
    Returns dict with status or error message.
    """
    member = Member.query.filter_by(username=username).first()
    if not member:
        return {'error': 'Member not found', 'code': 404}

    member.full_name = data.get('fullname', member.full_name)
    member.email = data.get('email', member.email)
    member.phone = data.get('phone', member.phone)

    date_of_birth = data.get('dateOfBirth')
    if date_of_birth:
        member.date_of_birth = date.fromisoformat(date_of_birth) if isinstance(date_of_birth, str) else date_of_birth

    member.cpf = data.get('cpf', member.cpf)
    
    service_preferences = data.get('servicePreferences')
    if service_preferences is not None:
        if isinstance(service_preferences, list):
            member.service_preferences = ','.join(service_preferences)
        else:
            member.service_preferences = service_preferences
    
    member.gender = data.get('gender', member.gender)

    _apply_address_update(member, data)

    db.session.commit()
    return {'message': 'Member profile updated successfully'}
