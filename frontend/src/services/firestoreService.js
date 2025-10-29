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
  getDoc,
  onSnapshot,
  setDoc
} from 'firebase/firestore'
import { db } from './firebaseConfig'

// Utilidad para obtener la referencia a la subcolección del usuario
function userTransactionsCol(userId) {
  return collection(db, 'users', userId, 'transactions')
}

/**
 * Crear una nueva transacción en /users/{userId}/transactions
 */
export async function createTransaction(transactionData, userId) {
  try {
    const transaction = {
      ...transactionData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const docRef = await addDoc(userTransactionsCol(userId), transaction)
    return docRef.id
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw new Error('Error al crear la transacción')
  }
}

/**
 * Obtener todas las transacciones del usuario
 */
export async function getUserTransactions(userId) {
  try {
    const q = query(
      userTransactionsCol(userId),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const transactions = []
    querySnapshot.forEach((docSnap) => {
      transactions.push({ id: docSnap.id, ...docSnap.data() })
    })
    return transactions
  } catch (error) {
    console.error('Error getting transactions:', error)
    const code = error?.code || 'unknown'
    if (code === 'failed-precondition') {
      // Fallback: usar solo un orderBy (no requiere índice compuesto)
      const simpleQ = query(userTransactionsCol(userId), orderBy('date', 'desc'))
      const snapshot = await getDocs(simpleQ)
      const transactions = []
      snapshot.forEach((docSnap) => {
        transactions.push({ id: docSnap.id, ...docSnap.data() })
      })
      return transactions
    }
    let message = 'Error al obtener las transacciones'
    if (code === 'permission-denied') {
      message = 'Permisos insuficientes para leer tus transacciones'
    } else if (code === 'failed-precondition') {
      message = 'Falta crear índices de Firestore para esta consulta'
    }
    const err = new Error(message)
    err.code = code
    throw err
  }
}

/**
 * Suscripción en tiempo real a las transacciones del usuario
 */
export function subscribeUserTransactions(userId, onChange) {
  const q = query(
    userTransactionsCol(userId),
    orderBy('date', 'desc'),
    orderBy('createdAt', 'desc')
  )
  let unsubscribe = onSnapshot(q, (snapshot) => {
    const transactions = []
    snapshot.forEach((docSnap) => {
      transactions.push({ id: docSnap.id, ...docSnap.data() })
    })
    onChange(transactions)
  }, (error) => {
    console.error('onSnapshot transactions error:', error)
    if (error?.code === 'failed-precondition') {
      // Fallback: reintentar con consulta simple (solo date)
      try { unsubscribe?.() } catch {}
      const simpleQ = query(userTransactionsCol(userId), orderBy('date', 'desc'))
      unsubscribe = onSnapshot(simpleQ, (snapshot2) => {
        const txs = []
        snapshot2.forEach((docSnap) => txs.push({ id: docSnap.id, ...docSnap.data() }))
        onChange(txs)
      })
    }
  })
  return unsubscribe
}

/**
 * Obtener una transacción específica del usuario
 */
export async function getTransaction(transactionId, userId) {
  try {
    const docRef = doc(db, 'users', userId, 'transactions', transactionId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error('Transacción no encontrada')
    }
    const transaction = { id: docSnap.id, ...docSnap.data() }
    // Verificar pertenencia por si los datos no incluyen userId
    if (transaction.userId && transaction.userId !== userId) {
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
 */
export async function updateTransaction(transactionId, updateData, userId) {
  try {
    await getTransaction(transactionId, userId)
    const docRef = doc(db, 'users', userId, 'transactions', transactionId)
    const dataToUpdate = { ...updateData, updatedAt: serverTimestamp() }
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
 */
export async function deleteTransaction(transactionId, userId) {
  try {
    await getTransaction(transactionId, userId)
    const docRef = doc(db, 'users', userId, 'transactions', transactionId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting transaction:', error)
    throw new Error(error.message || 'Error al eliminar la transacción')
  }
}

/**
 * Obtener transacciones filtradas por tipo
 */
export async function getTransactionsByType(userId, type) {
  try {
    const q = query(
      userTransactionsCol(userId),
      where('type', '==', type),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const transactions = []
    snapshot.forEach((docSnap) => {
      transactions.push({ id: docSnap.id, ...docSnap.data() })
    })
    return transactions
  } catch (error) {
    console.error('Error getting transactions by type:', error)
    const code = error?.code || 'unknown'
    if (code === 'failed-precondition') {
      // Fallback: solo filtro por tipo, sin orderBy compuesto. Ordenamos localmente por date.
      const simpleQ = query(userTransactionsCol(userId), where('type', '==', type))
      const snapshot = await getDocs(simpleQ)
      const transactions = []
      snapshot.forEach((docSnap) => transactions.push({ id: docSnap.id, ...docSnap.data() }))
      // Orden local por date desc
      transactions.sort((a, b) => String(b.date).localeCompare(String(a.date)))
      return transactions
    }
    let message = 'Error al obtener las transacciones por tipo'
    if (code === 'failed-precondition') {
      message = 'Falta crear índices (type + date + createdAt) en Firestore'
    } else if (code === 'permission-denied') {
      message = 'Permisos insuficientes para leer transacciones por tipo'
    }
    const err = new Error(message)
    err.code = code
    throw err
  }
}

/**
 * Obtener transacciones filtradas por categoría
 */
export async function getTransactionsByCategory(userId, category) {
  try {
    const q = query(
      userTransactionsCol(userId),
      where('category', '==', category),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const transactions = []
    snapshot.forEach((docSnap) => {
      transactions.push({ id: docSnap.id, ...docSnap.data() })
    })
    return transactions
  } catch (error) {
    console.error('Error getting transactions by category:', error)
    const code = error?.code || 'unknown'
    if (code === 'failed-precondition') {
      // Fallback: solo filtro por categoría, sin orderBy compuesto. Ordenamos localmente.
      const simpleQ = query(userTransactionsCol(userId), where('category', '==', category))
      const snapshot = await getDocs(simpleQ)
      const transactions = []
      snapshot.forEach((docSnap) => transactions.push({ id: docSnap.id, ...docSnap.data() }))
      transactions.sort((a, b) => String(b.date).localeCompare(String(a.date)))
      return transactions
    }
    let message = 'Error al obtener las transacciones por categoría'
    if (code === 'failed-precondition') {
      message = 'Falta crear índices (category + date + createdAt) en Firestore'
    } else if (code === 'permission-denied') {
      message = 'Permisos insuficientes para leer transacciones por categoría'
    }
    const err = new Error(message)
    err.code = code
    throw err
  }
}

/**
 * Obtener resumen de transacciones (totales por tipo)
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
    transactions.forEach((t) => {
      if (t.type === 'ingreso') summary.totalIngresos += t.amount
      else if (t.type === 'gasto') summary.totalGastos += t.amount
    })
    summary.balance = summary.totalIngresos - summary.totalGastos
    return summary
  } catch (error) {
    console.error('Error getting transactions summary:', error)
    throw new Error('Error al obtener el resumen de transacciones')
  }
}

/**
 * Guardar categorías personalizadas del usuario en Firestore
 */
export async function saveUserCategories(userId, categoriesData) {
  try {
    console.log('saveUserCategories called with:', { userId, categoriesData })
    const docRef = doc(db, 'users', userId, 'settings', 'categories')
    console.log('Document reference created:', docRef.path)
    
    // Verificar si el documento existe primero
    console.log('Checking if document exists...')
    const docSnap = await getDoc(docRef)
    console.log('Document exists:', docSnap.exists())
    
    if (docSnap.exists()) {
      // El documento existe, actualizarlo
      console.log('Updating existing document...')
      await updateDoc(docRef, {
        ...categoriesData,
        updatedAt: serverTimestamp()
      })
      console.log('Document updated successfully')
    } else {
      // El documento no existe, crearlo
      console.log('Creating new document...')
      await setDoc(docRef, {
        ...categoriesData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('Document created successfully')
    }
  } catch (error) {
    console.error('Error saving user categories:', error)
    console.error('Error details:', error.code, error.message)
    console.error('Full error object:', error)
    throw new Error('Error al guardar las categorías personalizadas')
  }
}

/**
 * Obtener categorías personalizadas del usuario desde Firestore
 */
export async function getUserCategories(userId) {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'categories')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      return null // No hay categorías personalizadas guardadas
    }
  } catch (error) {
    console.error('Error getting user categories:', error)
    throw new Error('Error al obtener las categorías personalizadas')
  }
}