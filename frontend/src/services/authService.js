import { auth, storage } from './firebaseConfig'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { UsernameService } from './usernameService'

export async function registerUser(email, password, name, username = null) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    
    // Si se proporciona un username, registrarlo
    if (username) {
      try {
        await UsernameService.registerUsername(cred.user.uid, username)
      } catch (usernameError) {
        // Si falla el registro del username, eliminar la cuenta creada
        await deleteUser(cred.user)
        throw new Error(`Error al registrar username: ${usernameError.message}`)
      }
    }
    
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
    
    const friendlyMessage = errorMessages[error.code] || error.message || 'Error al crear la cuenta. Intenta nuevamente'
    
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

export async function updateUserDisplayName(name) {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado')
    await updateProfile(auth.currentUser, { displayName: name })
    return auth.currentUser
  } catch (error) {
    const friendlyMessage = error.message || 'Error al actualizar el nombre'
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function changeUserEmail(newEmail, currentPassword) {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado')
    try {
      await updateEmail(auth.currentUser, newEmail)
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        if (!currentPassword) {
          const e = new Error('Esta operación requiere tu contraseña actual')
          e.code = error.code
          throw e
        }
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
        await reauthenticateWithCredential(auth.currentUser, credential)
        await updateEmail(auth.currentUser, newEmail)
      } else {
        throw error
      }
    }
    // Tras cambiar email, marcar como no verificado y enviar verificación
    await sendEmailVerification(auth.currentUser)
    return auth.currentUser
  } catch (error) {
    const errorMessages = {
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/email-already-in-use': 'Este correo ya está en uso por otra cuenta',
      'auth/requires-recent-login': 'Por seguridad, debes reautenticarte',
    }
    const friendlyMessage = errorMessages[error.code] || error.message || 'Error al actualizar el correo'
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function updateUserPassword(currentPassword, newPassword) {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado')
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)
    await updatePassword(auth.currentUser, newPassword)
    return { success: true }
  } catch (error) {
    const errorMessages = {
      'auth/weak-password': 'La contraseña es muy débil. Usa al menos 8 caracteres y mezcla letras, números y símbolos',
      'auth/wrong-password': 'Tu contraseña actual es incorrecta',
      'auth/requires-recent-login': 'Por seguridad, debes reautenticarte',
    }
    const friendlyMessage = errorMessages[error.code] || error.message || 'Error al actualizar la contraseña'
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms)
    promise.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

export async function uploadUserProfilePhoto(file) {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado')
    if (!file) throw new Error('No se seleccionó archivo')
    const uid = auth.currentUser.uid
    const ext = (file.name?.split('.')?.pop() || 'jpg').toLowerCase()
    const path = `profile_photos/${uid}/avatar_${Date.now()}.${ext}`
    const ref = storageRef(storage, path)
    const metadata = { contentType: file.type || 'image/jpeg', cacheControl: 'public, max-age=3600' }
    const task = uploadBytesResumable(ref, file, metadata)
    await new Promise((resolve, reject) => {
      task.on('state_changed', null, reject, resolve)
    })
    const url = await withTimeout(getDownloadURL(ref), 15000, 'Timeout al obtener la URL de descarga')
    await updateProfile(auth.currentUser, { photoURL: url })
    return url
  } catch (error) {
    const errorMessages = {
      'storage/unauthorized': 'Permisos insuficientes para subir o leer la imagen',
      'storage/canceled': 'La subida fue cancelada',
      'storage/unknown': 'Error desconocido de Storage'
    }
    const friendlyMessage = errorMessages[error.code] || error.message || 'Error al subir la foto de perfil'
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function sendVerification() {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado')
    await sendEmailVerification(auth.currentUser)
    return { success: true }
  } catch (error) {
    const friendlyMessage = error.message || 'Error al enviar verificación de correo'
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

export async function deleteAccount(currentPassword) {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado')
    
    const uid = auth.currentUser.uid
    
    if (currentPassword) {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
    }
    
    // Obtener y eliminar el username antes de eliminar la cuenta
    try {
      const username = await UsernameService.getUsernameFromUid(uid)
      if (username) {
        await UsernameService.deleteUsername(username)
      }
    } catch (usernameError) {
      console.warn('Error al eliminar username:', usernameError)
      // Continuar con la eliminación de la cuenta aunque falle el username
    }
    
    await deleteUser(auth.currentUser)
    return { success: true }
  } catch (error) {
    const errorMessages = {
      'auth/requires-recent-login': 'Por seguridad, debes reautenticarte para eliminar tu cuenta',
    }
    const friendlyMessage = errorMessages[error.code] || error.message || 'Error al eliminar la cuenta'
    const friendlyError = new Error(friendlyMessage)
    friendlyError.code = error.code
    throw friendlyError
  }
}

// Funciones específicas para manejo de usernames
export async function checkUsernameAvailability(username) {
  return await UsernameService.isUsernameAvailable(username)
}

export async function registerUserUsername(username) {
  if (!auth.currentUser) throw new Error('Usuario no autenticado')
  return await UsernameService.registerUsername(auth.currentUser.uid, username)
}

export async function updateUserUsername(oldUsername, newUsername) {
  if (!auth.currentUser) throw new Error('Usuario no autenticado')
  return await UsernameService.updateUsername(auth.currentUser.uid, oldUsername, newUsername)
}

export async function getCurrentUserUsername() {
  if (!auth.currentUser) return null
  return await UsernameService.getUsernameFromUid(auth.currentUser.uid)
}

export async function generateUsernameSuggestions(baseName) {
  return await UsernameService.generateUsernameSuggestions(baseName)
}