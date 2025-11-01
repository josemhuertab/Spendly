import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebaseConfig'

/**
 * Servicio para manejar usernames únicos en Firestore
 */
export class UsernameService {
  
  /**
   * Verifica si un username está disponible
   * @param {string} username - El username a verificar
   * @returns {Promise<boolean>} - true si está disponible, false si ya existe
   */
  static async isUsernameAvailable(username) {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
      return !usernameDoc.exists()
    } catch (error) {
      console.error('Error verificando disponibilidad de username:', error)
      
      // Si es un error de permisos (reglas no desplegadas), asumir disponible temporalmente
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Reglas de Firestore no desplegadas. Asumiendo username disponible temporalmente.')
        return true
      }
      
      throw error
    }
  }

  /**
   * Obtiene el UID asociado a un username
   * @param {string} username - El username a buscar
   * @returns {Promise<string|null>} - El UID del usuario o null si no existe
   */
  static async getUidFromUsername(username) {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
      if (usernameDoc.exists()) {
        return usernameDoc.data().uid
      }
      return null
    } catch (error) {
      console.error('Error obteniendo UID desde username:', error)
      throw error
    }
  }

  /**
   * Obtiene el username asociado a un UID
   * @param {string} uid - El UID del usuario
   * @returns {Promise<string|null>} - El username del usuario o null si no existe
   */
  static async getUsernameFromUid(uid) {
    try {
      const q = query(collection(db, 'usernames'), where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().username
      }
      return null
    } catch (error) {
      console.error('Error obteniendo username desde UID:', error)
      throw error
    }
  }

  /**
   * Registra un nuevo username para un usuario
   * @param {string} uid - El UID del usuario autenticado
   * @param {string} username - El username deseado
   * @returns {Promise<boolean>} - true si se registró exitosamente
   */
  static async registerUsername(uid, username) {
    try {
      const normalizedUsername = username.toLowerCase()
      
      // Validar formato del username
      if (!this.validateUsernameFormat(username)) {
        throw new Error('Formato de username inválido')
      }

      // Verificar disponibilidad
      const isAvailable = await this.isUsernameAvailable(normalizedUsername)
      if (!isAvailable) {
        throw new Error('Username no disponible')
      }

      // Registrar el username
      await setDoc(doc(db, 'usernames', normalizedUsername), {
        uid: uid,
        username: username, // Mantener el formato original
        createdAt: serverTimestamp()
      })

      return true
    } catch (error) {
      console.error('Error registrando username:', error)
      
      // Si es un error de permisos, dar un mensaje más claro
      if (error.code === 'permission-denied') {
        throw new Error('Las reglas de Firestore necesitan ser actualizadas. Contacta al administrador.')
      }
      
      throw error
    }
  }

  /**
   * Actualiza el username de un usuario
   * @param {string} uid - El UID del usuario autenticado
   * @param {string} oldUsername - El username actual
   * @param {string} newUsername - El nuevo username deseado
   * @returns {Promise<boolean>} - true si se actualizó exitosamente
   */
  static async updateUsername(uid, oldUsername, newUsername) {
    try {
      const normalizedOldUsername = oldUsername.toLowerCase()
      const normalizedNewUsername = newUsername.toLowerCase()

      // Si es el mismo username, no hacer nada
      if (normalizedOldUsername === normalizedNewUsername) {
        return true
      }

      // Validar formato del nuevo username
      if (!this.validateUsernameFormat(newUsername)) {
        throw new Error('Formato de username inválido')
      }

      // Verificar disponibilidad del nuevo username
      const isAvailable = await this.isUsernameAvailable(normalizedNewUsername)
      if (!isAvailable) {
        throw new Error('Username no disponible')
      }

      // Eliminar el username anterior
      await deleteDoc(doc(db, 'usernames', normalizedOldUsername))

      // Registrar el nuevo username
      await setDoc(doc(db, 'usernames', normalizedNewUsername), {
        uid: uid,
        username: newUsername,
        createdAt: serverTimestamp()
      })

      return true
    } catch (error) {
      console.error('Error actualizando username:', error)
      throw error
    }
  }

  /**
   * Elimina el username de un usuario
   * @param {string} username - El username a eliminar
   * @returns {Promise<boolean>} - true si se eliminó exitosamente
   */
  static async deleteUsername(username) {
    try {
      await deleteDoc(doc(db, 'usernames', username.toLowerCase()))
      return true
    } catch (error) {
      console.error('Error eliminando username:', error)
      throw error
    }
  }

  /**
   * Valida el formato de un username
   * @param {string} username - El username a validar
   * @returns {boolean} - true si el formato es válido
   */
  static validateUsernameFormat(username) {
    if (!username || typeof username !== 'string') {
      return false
    }

    // Entre 3 y 20 caracteres, solo letras, números y guiones bajos
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  /**
   * Genera sugerencias de username basadas en un nombre
   * @param {string} baseName - Nombre base para generar sugerencias
   * @returns {Promise<string[]>} - Array de usernames sugeridos disponibles
   */
  static async generateUsernameSuggestions(baseName) {
    try {
      const suggestions = []
      const cleanBaseName = baseName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
      
      if (cleanBaseName.length < 3) {
        return suggestions
      }

      // Sugerencias básicas
      const baseSuggestions = [
        cleanBaseName,
        `${cleanBaseName}123`,
        `${cleanBaseName}_user`,
        `user_${cleanBaseName}`,
        `${cleanBaseName}${Math.floor(Math.random() * 1000)}`
      ]

      // Verificar disponibilidad de cada sugerencia
      for (const suggestion of baseSuggestions) {
        if (suggestion.length >= 3 && suggestion.length <= 20) {
          const isAvailable = await this.isUsernameAvailable(suggestion)
          if (isAvailable) {
            suggestions.push(suggestion)
          }
        }
      }

      return suggestions.slice(0, 5) // Máximo 5 sugerencias
    } catch (error) {
      console.error('Error generando sugerencias de username:', error)
      return []
    }
  }
}