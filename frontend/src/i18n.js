import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Welcome": "Welcome",
          "Login": "Login",
          "Register": "Register",
          "Username": "Username",
          "Password": "Password",
          "Enter your username": "Enter your username",
          "Enter your password": "Enter your password",
          "Don't have an account?": "Don't have an account?",
          "here": "here"
        }
      },
      pt: {
        translation: {
          "Welcome": "Bem-vindo",
          "Enroll Member": "Registrar Membro",
          "Login": "Entrar",
          "Register": "Registrar",
          "Unjoin": "Desligar",
          "Show Inactive Members": "Mostrar membros inativos",
          "Logout": "Sair",
          "Username": "Nome de usuário",
          "Password": "Senha",
          "Enter your username": "Digite seu nome de usuário",
          "Enter your password": "Digite sua senha",
          "Don't have an account?": "Não tem uma conta?",
          "Children": "Crianças",
          "Women": "Mulheres",
          "Men": "Homens",
          "Youth": "Jovens",
          "Worship": "Adoração/Louvor",
          "Integration": "Integração",
          "About": "Sobre",
          "here": "aqui"
        }
      }
    },
    lng: navigator.language?.split('-')[0] || 'en',
    supportedLngs: ['en', 'pt'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;