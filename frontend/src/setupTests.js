import '@testing-library/jest-dom';
import axios from './api/client';
import i18n from './i18n';

beforeAll(() => {
    i18n.changeLanguage('en');
});

beforeEach(() => {
    localStorage.clear();
    delete axios.defaults.headers.common.Authorization;
});
