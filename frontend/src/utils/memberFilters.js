export const EMPTY_FILTERS = {
    fullname: '',
    email: '',
    phone: '',
    cpf: '',
    gender: [],
    servicePreferences: [],
    status: [],
    dateOfBirth: ''
};

export const hasActiveFilters = (filters, showInactive) => {
    if (showInactive) return true;
    return Object.values(filters).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
    );
};
