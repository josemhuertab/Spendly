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

export async function getSavings(userId, year) {
  try {
    let q
    if (year) {
      q = query(userSavingsCol(userId), where('year', '==', Number(year)), orderBy('month', 'asc'))
    } else {
      q = query(userSavingsCol(userId), orderBy('year', 'desc'), orderBy('month', 'asc'))
    }
    const snapshot = await getDocs(q)
    const savings = []
    snapshot.forEach((docSnap) => savings.push({ id: docSnap.id, ...docSnap.data() }))
    return savings
  } catch (error) {
    // Fallback si falta índice
    if (error?.code === 'failed-precondition') {
      const snapshot = await getDocs(userSavingsCol(userId))
      const savings = []
      snapshot.forEach((docSnap) => savings.push({ id: docSnap.id, ...docSnap.data() }))
      if (year) savings.filter((s) => s.year === Number(year))
      savings.sort((a, b) => (a.year - b.year) || (a.month - b.month))
      return savings
    }
    console.error('Error getting savings:', error)
    throw new Error(error.message || 'Error al obtener ahorros')
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
  const savings = await getSavings(userId, year)
  const total = savings.reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const byMonth = Array.from({ length: 12 }, () => 0)
  savings.forEach((s) => {
    const m = Number(s.month)
    if (m >= 1 && m <= 12) byMonth[m - 1] += Number(s.amount || 0)
  })
  return {
    totalAll: year ? total : savings.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    totalYear: total,
    byMonth,
    count: savings.length,
  }
}