import { UsernameService } from '../services/usernameService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebaseConfig'

/**
 * Utilidades para manejo de usuarios y usernames
 */
export class UserUtils {
  
  /**
   * Busca un usuario por username y retorna información básica
   * @param {string} username - El username a buscar
   * @returns {Promise<Object|null>} - Información del usuario o null si no existe
   */
  static async findUserByUsername(username) {
    try {
      const uid = await UsernameService.getUidFromUsername(username)
      if (!uid) return null

      // Obtener información básica del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (!userDoc.exists()) return null

      const userData = userDoc.data()
      return {
        uid,
        username,
        displayName: userData.displayName || 'Usuario',
        photoURL: userData.photoURL || null,
        // No incluir información sensible
      }
    } catch (error) {
      console.error('Error buscando usuario por username:', error)
      return null
    }
  }

  /**
   * Obtiene información pública de un usuario por UID
   * @param {string} uid - El UID del usuario
   * @returns {Promise<Object|null>} - Información pública del usuario
   */
  static async getPublicUserInfo(uid) {
    try {
      const [userDoc, username] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        UsernameService.getUsernameFromUid(uid)
      ])

      if (!userDoc.exists()) return null

      const userData = userDoc.data()
      return {
        uid,
        username: username || null,
        displayName: userData.displayName || 'Usuario',
        photoURL: userData.photoURL || null,
      }
    } catch (error) {
      console.error('Error obteniendo información pública del usuario:', error)
      return null
    }
  }

  /**
   * Busca usuarios por término de búsqueda (nombre o username)
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Límite de resultados (default: 10)
   * @returns {Promise<Array>} - Array de usuarios encontrados
   */
  static async searchUsers(searchTerm, limit = 10) {
    try {
      const results = []
      const normalizedTerm = searchTerm.toLowerCase().trim()

      if (!normalizedTerm || normalizedTerm.length < 2) {
        return results
      }

      // Buscar por username exacto primero
      const userByUsername = await this.findUserByUsername(normalizedTerm)
      if (userByUsername) {
        results.push(userByUsername)
      }

      // TODO: Implementar búsqueda por nombre si es necesario
      // Esto requeriría índices adicionales en Firestore

      return results.slice(0, limit)
    } catch (error) {
      console.error('Error buscando usuarios:', error)
      return []
    }
  }

  /**
   * Valida si un string puede ser un username válido
   * @param {string} username - El username a validar
   * @returns {boolean} - true si es válido
   */
  static isValidUsernameFormat(username) {
    return UsernameService.validateUsernameFormat(username)
  }

  /**
   * Formatea un username para mostrar (con @)
   * @param {string} username - El username a formatear
   * @returns {string} - Username formateado
   */
  static formatUsername(username) {
    if (!username) return ''
    return username.startsWith('@') ? username : `@${username}`
  }

  /**
   * Limpia un username (remueve @)
   * @param {string} username - El username a limpiar
   * @returns {string} - Username limpio
   */
  static cleanUsername(username) {
    if (!username) return ''
    return username.startsWith('@') ? username.slice(1) : username
  }

  /**
   * Genera un enlace de perfil para un usuario
   * @param {string} username - El username del usuario
   * @returns {string} - URL del perfil
   */
  static getProfileUrl(username) {
    if (!username) return '#'
    const cleanedUsername = this.cleanUsername(username)
    return `/profile/${cleanedUsername}`
  }

  /**
   * Verifica si un usuario es el usuario actual
   * @param {string} uid - UID del usuario a verificar
   * @param {Object} currentUser - Usuario actual de Firebase Auth
   * @returns {boolean} - true si es el usuario actual
   */
  static isCurrentUser(uid, currentUser) {
    return currentUser && currentUser.uid === uid
  }
}