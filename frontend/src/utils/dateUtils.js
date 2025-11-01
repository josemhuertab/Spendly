/**
 * Utilidades para manejo correcto de fechas locales
 * Evita problemas de zona horaria en la aplicación
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria local
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getTodayLocalDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte una fecha string (YYYY-MM-DD) a objeto Date en zona horaria local
 * Evita el problema de interpretación UTC que causa cambios de día
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date en zona horaria local
 */
export function parseLocalDate(dateString) {
  if (!dateString) return null
  
  const [year, month, day] = dateString.split('-').map(Number)
  // Crear fecha en zona horaria local (no UTC)
  return new Date(year, month - 1, day)
}

/**
 * Convierte un objeto Date a string en formato YYYY-MM-DD en zona horaria local
 * @param {Date} date - Objeto Date
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatLocalDateString(date) {
  if (!date) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Verifica si una fecha está en un mes y año específicos
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {number} year - Año
 * @param {number} month - Mes (1-12)
 * @returns {boolean}
 */
export function isDateInMonth(dateString, year, month) {
  const date = parseLocalDate(dateString)
  if (!date) return false
  
  return date.getFullYear() === year && (date.getMonth() + 1) === month
}

/**
 * Verifica si una fecha está en un año específico
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {number} year - Año
 * @returns {boolean}
 */
export function isDateInYear(dateString, year) {
  const date = parseLocalDate(dateString)
  if (!date) return false
  
  return date.getFullYear() === year
}

/**
 * Compara dos fechas string (YYYY-MM-DD)
 * @param {string} dateString1 
 * @param {string} dateString2 
 * @returns {number} -1 si date1 < date2, 0 si iguales, 1 si date1 > date2
 */
export function compareDateStrings(dateString1, dateString2) {
  if (dateString1 === dateString2) return 0
  return dateString1 < dateString2 ? -1 : 1
}