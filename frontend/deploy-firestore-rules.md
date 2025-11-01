# Desplegar Reglas de Firestore

## Opción 1: Firebase CLI (Recomendado)

### Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### Inicializar Firebase en el proyecto
```bash
cd frontend
firebase login
firebase init firestore
```

### Desplegar las reglas
```bash
firebase deploy --only firestore:rules
```

## Opción 2: Consola de Firebase (Manual)

### Pasos:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Reglas**
4. Copia y pega el contenido del archivo `firestore.rules`
5. Haz clic en **Publicar**

## Opción 3: Verificar Conexión Primero

### Crear un test simple para verificar la conexión:

```javascript
// test-firestore-connection.js
import { db } from './src/services/firebaseConfig.js'
import { doc, getDoc } from 'firebase/firestore'

async function testConnection() {
  try {
    // Intentar leer un documento que no existe (no debería dar error de conexión)
    const testDoc = await getDoc(doc(db, 'test', 'connection'))
    console.log('✅ Conexión a Firestore exitosa')
    console.log('Documento existe:', testDoc.exists())
  } catch (error) {
    console.error('❌ Error de conexión a Firestore:', error)
  }
}

testConnection()
```

## Reglas Actuales a Desplegar

Las reglas incluyen:
- ✅ Colección `usernames` para mapeo username ↔ UID
- ✅ Validación de formato de username
- ✅ Permisos de lectura para verificar disponibilidad
- ✅ Permisos de escritura solo para el dueño
- ✅ Todas las reglas existentes de usuarios, transacciones, etc.

## Verificar Despliegue

Después de desplegar, puedes verificar que funciona:

1. **En la consola de Firebase**: Ve a Firestore → Reglas y verifica que se actualizaron
2. **En tu app**: Intenta crear un username y debería funcionar
3. **En el simulador**: Usa el simulador de reglas en Firebase Console

## Troubleshooting

### Error: "Permission denied"
- Verifica que el usuario esté autenticado
- Revisa que las reglas se desplegaron correctamente

### Error: "Function not found"
- Asegúrate de que todas las funciones de validación estén incluidas
- Verifica la sintaxis de las reglas

### Error de conexión
- Verifica la configuración de Firebase en `firebaseConfig.js`
- Asegúrate de que el proyecto esté activo en Firebase Console