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
  onSnapshot
} from 'firebase/firestore'
import { db } from './firebaseConfig'

function userSavingsCol(userId) {
  return collection(db, 'users', userId, 'savings')
}

export async function addSaving(userId, data) {
  try {
    const saving = {
      userId,
      year: Number(data.year),
      month: Number(data.month), // 1-12
      amount: Number(data.amount),
      note: data.note || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const docRef = await addDoc(userSavingsCol(userId), saving)
    return docRef.id
  } catch (error) {
    console.error('Error adding saving:', error)
    throw new Error(error.message || 'Error al agregar ahorro')
  }
}

export const getSavings = async (userId, year = null) => {
  try {
    const savingsRef = collection(db, 'users', userId, 'savings')
    
    let q = query(savingsRef)
    
    if (year) {
      q = query(savingsRef, where('year', '==', year), orderBy('month'))
    } else {
      q = query(savingsRef, orderBy('year', 'desc'), orderBy('month', 'desc'))
    }
    
    const querySnapshot = await getDocs(q)
    
    const savings = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      savings.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      })
    })
    
    return savings
  } catch (error) {
    console.error('Error al obtener ahorros:', error)
    throw error
  }
}

export function subscribeSavings(userId, year, onChange) {
  let q
  if (year) {
    q = query(userSavingsCol(userId), where('year', '==', Number(year)), orderBy('month', 'asc'))
  } else {
    q = query(userSavingsCol(userId), orderBy('year', 'desc'), orderBy('month', 'asc'))
  }
  let unsubscribe = onSnapshot(q, (snapshot) => {
    const savings = []
    snapshot.forEach((docSnap) => savings.push({ id: docSnap.id, ...docSnap.data() }))
    onChange(savings)
  }, (error) => {
    console.error('subscribeSavings error:', error)
    if (error?.code === 'failed-precondition') {
      try { unsubscribe?.() } catch {}
      const simpleQ = year
        ? query(userSavingsCol(userId), where('year', '==', Number(year)))
        : query(userSavingsCol(userId))
      unsubscribe = onSnapshot(simpleQ, (snap2) => {
        const list = []
        snap2.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }))
        list.sort((a, b) => (a.year - b.year) || (a.month - b.month))
        onChange(list)
      })
    }
  })
  return unsubscribe
}

export async function updateSaving(userId, id, updateData) {
  try {
    const docRef = doc(db, 'users', userId, 'savings', id)
    const dataToUpdate = {
      ...updateData,
      year: Number(updateData.year),
      month: Number(updateData.month),
      amount: Number(updateData.amount),
      updatedAt: serverTimestamp()
    }
    delete dataToUpdate.id
    delete dataToUpdate.userId
    delete dataToUpdate.createdAt
    await updateDoc(docRef, dataToUpdate)
  } catch (error) {
    console.error('Error updating saving:', error)
    throw new Error(error.message || 'Error al actualizar el ahorro')
  }
}

export async function deleteSaving(userId, id) {
  try {
    const docRef = doc(db, 'users', userId, 'savings', id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting saving:', error)
    throw new Error(error.message || 'Error al eliminar el ahorro')
  }
}

export async function getSavingsSummary(userId, year) {
  // Ahorros del año seleccionado
  const yearSavings = await getSavings(userId, year)
  const totalYear = yearSavings.reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const byMonth = Array.from({ length: 12 }, () => 0)
  yearSavings.forEach((s) => {
    const m = Number(s.month)
    if (m >= 1 && m <= 12) byMonth[m - 1] += Number(s.amount || 0)
  })
  // Ahorros totales (todos los años)
  const allSavings = await getSavings(userId, null)
  const totalAll = allSavings.reduce((sum, s) => sum + Number(s.amount || 0), 0)

  return {
    totalAll,
    totalYear,
    byMonth,
    count: yearSavings.length,
  }
}

// Nuevo: upsert de montos por año (12 meses)
export async function upsertMonthlySavings(userId, year, monthsArray) {
  // monthsArray: array de 12 números (índice 0 -> enero)
  const existing = await getSavings(userId, year)
  const ops = []
  for (let i = 0; i < 12; i++) {
    const amount = Number(monthsArray[i] || 0)
    const month = i + 1
    const current = existing.find((s) => Number(s.month) === month)
    if (!amount || amount <= 0) {
      // Si el mes no tiene monto, no crear nada; opcionalmente podríamos borrar
      continue
    }
    if (current) {
      ops.push(updateSaving(userId, current.id, { year: Number(year), month, amount }))
    } else {
      ops.push(addSaving(userId, { year: Number(year), month, amount }))
    }
  }
  await Promise.all(ops)
  return true
}