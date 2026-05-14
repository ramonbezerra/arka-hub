import re
import secrets
import string
from pathlib import Path
from typing import TypedDict, Optional

import yaml
from langgraph.graph import StateGraph, START, END
from services.members_service import enroll_member

PROMPT_FILE = Path(__file__).resolve().parent / "agent_prompts.yml"

class MemberEnrollData(TypedDict, total=False):
    username: str
    email: str
    password: str
    fullname: str
    phone: str
    cpf: str
    gender: str
    servicePreferences: list[str]

class MemberEnrollState(TypedDict):
    """State for member enrollment workflow"""
    user_prompt: str
    extracted_data: MemberEnrollData
    enrollment_result: dict
    validation_errors: dict
    error: Optional[str]

class AgentOutput(TypedDict):
    success: bool
    message: str
    extracted: MemberEnrollData
    result: dict
    errors: dict


def load_prompt_config() -> dict:
    if not PROMPT_FILE.exists():
        return {}

    with PROMPT_FILE.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream) or {}

PROMPT_CONFIG = load_prompt_config()


def build_label_patterns() -> dict[str, str]:
    labels = PROMPT_CONFIG.get("member_enroll", {}).get("expected_fields", {})
    patterns: dict[str, str] = {}

    if labels:
        for field, config in labels.items():
            label_list = config.get("labels", [])
            joined = "|".join(re.escape(label) for label in label_list)
            patterns[field] = fr"(?:{joined})[\s:]*([^\n,]+)"
    else:
        patterns = {
            "username": r"(?:username|user|login)[\s:]*([^\n,]+)",
            "email": r"(?:email|mail)[\s:]*([^\n,]+)",
            "password": r"(?:password|pwd|pass)[\s:]*([^\n,]+)",
            "fullname": r"(?:fullname|full name|name)[\s:]*([^\n,]+)",
            "phone": r"(?:phone|tel|telephone)[\s:]*([^\n,]+)",
            "cpf": r"(?:cpf|document)[\s:]*([^\n,]+)",
            "gender": r"(?:gender|gênero|sex)[\s:]*([^\n,]+)",
            "servicePreferences": r"(?:preferences|preferências|services|serviços)[\s:]*([^\n,]+)"
        }

    return patterns

LABEL_PATTERNS = build_label_patterns()

def clean_phone(phone: str) -> str:
    """Remove non-digit characters from phone number"""
    return re.sub(r'\D', '', phone) if phone else ""

def clean_cpf(cpf: str) -> str:
    """Remove non-digit characters from CPF"""
    return re.sub(r'\D', '', cpf) if cpf else ""

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_cpf(cpf: str) -> bool:
    """Validate CPF has 11 digits"""
    cleaned = clean_cpf(cpf)
    return len(cleaned) == 11 and cleaned.isdigit()

def validate_phone(phone: str) -> bool:
    """Validate phone has 11 digits (Brazilian format)"""
    cleaned = clean_phone(phone)
    return len(cleaned) == 11 and cleaned.isdigit()

def validate_gender(gender: str) -> bool:
    """Validate gender is one of allowed values"""
    valid_genders = ['male', 'female', 'other', 'masculino', 'feminino', 'outro']
    return gender.lower() in valid_genders

def normalize_gender(gender: str) -> str:
    """Normalize gender to English format"""
    mapping = {
        'masculino': 'male',
        'feminino': 'female',
        'outro': 'other',
        'm': 'male',
        'f': 'female',
        'o': 'other'
    }
    return mapping.get(gender.lower(), gender.lower())

def generate_username(data: MemberEnrollData) -> str:
    """Generate a username from fullname or email"""
    if data.get("fullname"):
        base = re.sub(r'[^a-zA-Z0-9]', '', data["fullname"].lower())
        if len(base) >= 3:
            return base[:3] + base.split()[-1][:5]
    if data.get("email"):
        username = data["email"].split("@")[0]
        username = re.sub(r'[^a-zA-Z0-9._-]', '', username.lower())
        return username[:15]
    return "user" + secrets.token_hex(3)


def generate_password(length: int = 10) -> str:
    """Generate a secure password"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def extract_member_data(state: MemberEnrollState) -> MemberEnrollState:
    """
    Node 1: Extract member data from user prompt using pattern matching.
    Supports Portuguese and English field labels.
    """
    try:
        prompt = state["user_prompt"].lower()
        extracted: MemberEnrollData = {}

        for field, pattern in LABEL_PATTERNS.items():
            match = re.search(pattern, prompt)
            if match:
                value = match.group(1).strip()
                if field == "servicePreferences":
                    extracted[field] = [s.strip() for s in value.split(",") if s.strip()]
                else:
                    extracted[field] = value

        state["extracted_data"] = extracted
        return state

    except Exception as e:
        state["error"] = f"Erro ao extrair dados: {str(e)}"
        return state


def validate_and_normalize(state: MemberEnrollState) -> MemberEnrollState:
    """
    Node 2: Validate extracted data and normalize it to match form validation
    """
    if state.get("error"):
        return state

    data = state["extracted_data"]
    errors: dict = {}

    # Generate username if missing
    if not data.get("username"):
        data["username"] = generate_username(data)

    # Generate password if missing
    if not data.get("password"):
        data["password"] = generate_password()

    # Validate username
    if not data.get("username"):
        errors["username"] = "Campo obrigatório"
    elif len(data["username"]) < 3:
        errors["username"] = "Mínimo 3 caracteres"

    # Validate email
    if not data.get("email"):
        errors["email"] = "Campo obrigatório"
    elif not validate_email(data["email"]):
        errors["email"] = "Email inválido"

    # Validate password
    if not data.get("password"):
        errors["password"] = "Campo obrigatório"
    elif len(data["password"]) < 6:
        errors["password"] = "Mínimo 6 caracteres"

    # Validate fullname
    if not data.get("fullname"):
        errors["fullname"] = "Campo obrigatório"

    # Validate CPF
    if not data.get("cpf"):
        errors["cpf"] = "Campo obrigatório"
    elif not validate_cpf(data["cpf"]):
        errors["cpf"] = "CPF deve ter 11 dígitos"
    else:
        # Clean and normalize CPF
        data["cpf"] = clean_cpf(data["cpf"])

    # Validate phone
    if not data.get("phone"):
        errors["phone"] = "Campo obrigatório"
    elif not validate_phone(data["phone"]):
        errors["phone"] = "Telefone deve ter 11 dígitos (DDD + número)"
    else:
        # Clean and normalize phone
        data["phone"] = clean_phone(data["phone"])

    # Validate gender
    if not data.get("gender"):
        errors["gender"] = "Campo obrigatório"
    elif not validate_gender(data["gender"]):
        errors["gender"] = "Gênero inválido (male, female, other)"
    else:
        # Normalize gender
        data["gender"] = normalize_gender(data["gender"])

    if errors:
        state["validation_errors"] = errors
        state["error"] = "Dados extraídos com erros de validação"
        return state

    state["extracted_data"] = data
    state["validation_errors"] = {}
    return state


def execute_enroll(state: MemberEnrollState) -> MemberEnrollState:
    """Node 3: Execute member enrollment with validated data"""
    if state.get("error"):
        return state

    try:
        data = state["extracted_data"]

        result = enroll_member(
            username=data.get("username"),
            email=data.get("email"),
            password=data.get("password"),
            fullname=data.get("fullname", ""),
            phone=data.get("phone", ""),
            cpf=data.get("cpf"),
            gender=data.get("gender", ""),
            service_preferences=data.get("servicePreferences"),
            address_data=None
        )

        if "error" in result:
            state["error"] = result["error"]
        else:
            state["enrollment_result"] = result

        return state

    except Exception as e:
        state["error"] = f"Erro durante o cadastro: {str(e)}"
        return state


def build_enrollment_graph() -> object:
    """Build and compile the member enrollment workflow graph"""
    graph = StateGraph(MemberEnrollState)
    graph.add_node("extract", extract_member_data)
    graph.add_node("validate", validate_and_normalize)
    graph.add_node("enroll", execute_enroll)
    graph.add_edge(START, "extract")
    graph.add_edge("extract", "validate")
    graph.add_edge("validate", "enroll")
    graph.add_edge("enroll", END)
    return graph.compile()


enrollment_agent = build_enrollment_graph()


def process_enrollment_request(user_prompt: str) -> AgentOutput:
    """
    Process member enrollment request from natural language prompt.
    Validates data against form requirements and normalizes it.
    """
    initial_state: MemberEnrollState = {
        "user_prompt": user_prompt,
        "extracted_data": {},
        "enrollment_result": {},
        "validation_errors": {},
        "error": None
    }

    final_state = enrollment_agent.invoke(initial_state)
    output: AgentOutput = {
        "success": final_state.get("error") is None,
        "message": final_state.get("enrollment_result", {}).get("message") if final_state.get("error") is None else final_state.get("error", "Erro desconhecido"),
        "extracted": final_state.get("extracted_data", {}),
        "result": final_state.get("enrollment_result", {}),
        "errors": final_state.get("validation_errors", {})
    }
    return output
