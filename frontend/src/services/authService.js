import { auth } from './firebaseConfig'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from 'firebase/auth'

export async function registerUser(email, password, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    return cred.user
  } catch (error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Este correo electrónico ya está registrado. Intenta iniciar sesión o usa otro correo',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/operation-not-allowed': 'El registro con correo y contraseña no está habilitado',
      'auth/weak-password': 'La contraseña es muy débil. Debe tener al menos 6 caracteres',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet e intenta nuevamente',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde'
    }
    
    const friendlyMessage = errorMessages[error.code] || 'Error al crear la cuenta. Intenta nuevamente'
    
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (error) {
    const errorMessages = {
      'auth/user-not-found': 'Correo o contraseña incorrectos',
      'auth/wrong-password': 'Correo o contraseña incorrectos',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/invalid-credential': 'Correo o contraseña incorrectos'
    }
    
    const friendlyMessage = errorMessages[error.code] || 'Error al iniciar sesión. Verifica tus credenciales'
    
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function logoutUser() {
  await signOut(auth)
}

export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      (error) => {
        unsubscribe()
        reject(error)
      }
    )
  })
}

export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    const errorMessages = {
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet e intenta nuevamente'
    }
    
    const friendlyMessage = errorMessages[error.code] || 'Error al enviar el correo de recuperación'
    
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function resetPassword(oobCode, newPassword) {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword)
    return { success: true }
  } catch (error) {
    const errorMessages = {
      'auth/expired-action-code': 'El código de recuperación ha expirado. Solicita uno nuevo',
      'auth/invalid-action-code': 'El código de recuperación no es válido',
      'auth/weak-password': 'La contraseña es muy débil. Debe tener al menos 6 caracteres',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'No se encontró la cuenta asociada'
    }
    
    const friendlyMessage = errorMessages[error.code] || 'Error al restablecer la contraseña'
    
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}