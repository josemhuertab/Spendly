import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore'
import { db } from './firebaseConfig'

const TRANSACTIONS_COLLECTION = 'transactions'

/**
 * Crear una nueva transacción
 * @param {Object} transactionData - Datos de la transacción
 * @param {string} userId - ID del usuario autenticado
 * @returns {Promise<string>} ID del documento creado
 */
export async function createTransaction(transactionData, userId) {
  try {
    const transaction = {
      ...transactionData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transaction)
    return docRef.id
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw new Error('Error al crear la transacción')
  }
}

/**
 * Obtener todas las transacciones de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Array de transacciones
 */
export async function getUserTransactions(userId) {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const transactions = []
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return transactions
  } catch (error) {
    console.error('Error getting transactions:', error)
    throw new Error('Error al obtener las transacciones')
  }
}

/**
 * Obtener una transacción específica
 * @param {string} transactionId - ID de la transacción
 * @param {string} userId - ID del usuario (para verificar permisos)
 * @returns {Promise<Object>} Datos de la transacción
 */
export async function getTransaction(transactionId, userId) {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error('Transacción no encontrada')
    }
    
    const transaction = { id: docSnap.id, ...docSnap.data() }
    
    // Verificar que la transacción pertenece al usuario
    if (transaction.userId !== userId) {
      throw new Error('No tienes permisos para acceder a esta transacción')
    }
    
    return transaction
  } catch (error) {
    console.error('Error getting transaction:', error)
    throw new Error(error.message || 'Error al obtener la transacción')
  }
}

/**
 * Actualizar una transacción
 * @param {string} transactionId - ID de la transacción
 * @param {Object} updateData - Datos a actualizar
 * @param {string} userId - ID del usuario (para verificar permisos)
 * @returns {Promise<void>}
 */
export async function updateTransaction(transactionId, updateData, userId) {
  try {
    // Primero verificar que la transacción existe y pertenece al usuario
    await getTransaction(transactionId, userId)
    
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId)
    const dataToUpdate = {
      ...updateData,
      updatedAt: serverTimestamp()
    }
    
    // Remover campos que no deben ser actualizados
    delete dataToUpdate.id
    delete dataToUpdate.userId
    delete dataToUpdate.createdAt
    
    await updateDoc(docRef, dataToUpdate)
  } catch (error) {
    console.error('Error updating transaction:', error)
    throw new Error(error.message || 'Error al actualizar la transacción')
  }
}

/**
 * Eliminar una transacción
 * @param {string} transactionId - ID de la transacción
 * @param {string} userId - ID del usuario (para verificar permisos)
 * @returns {Promise<void>}
 */
export async function deleteTransaction(transactionId, userId) {
  try {
    // Primero verificar que la transacción existe y pertenece al usuario
    await getTransaction(transactionId, userId)
    
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting transaction:', error)
    throw new Error(error.message || 'Error al eliminar la transacción')
  }
}

/**
 * Obtener transacciones filtradas por tipo
 * @param {string} userId - ID del usuario
 * @param {string} type - Tipo de transacción ('gasto' | 'ingreso')
 * @returns {Promise<Array>} Array de transacciones filtradas
 */
export async function getTransactionsByType(userId, type) {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const transactions = []
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return transactions
  } catch (error) {
    console.error('Error getting transactions by type:', error)
    throw new Error('Error al obtener las transacciones por tipo')
  }
}

/**
 * Obtener transacciones filtradas por categoría
 * @param {string} userId - ID del usuario
 * @param {string} category - Categoría de la transacción
 * @returns {Promise<Array>} Array de transacciones filtradas
 */
export async function getTransactionsByCategory(userId, category) {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const transactions = []
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return transactions
  } catch (error) {
    console.error('Error getting transactions by category:', error)
    throw new Error('Error al obtener las transacciones por categoría')
  }
}

/**
 * Obtener resumen de transacciones (totales por tipo)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resumen con totales
 */
export async function getTransactionsSummary(userId) {
  try {
    const transactions = await getUserTransactions(userId)
    
    const summary = {
      totalIngresos: 0,
      totalGastos: 0,
      balance: 0,
      totalTransacciones: transactions.length
    }
    
    transactions.forEach(transaction => {
      if (transaction.type === 'ingreso') {
        summary.totalIngresos += transaction.amount
      } else if (transaction.type === 'gasto') {
        summary.totalGastos += transaction.amount
      }
    })
    
    summary.balance = summary.totalIngresos - summary.totalGastos
    
    return summary
  } catch (error) {
    console.error('Error getting transactions summary:', error)
    throw new Error('Error al obtener el resumen de transacciones')
  }
}