# Configuración de Firestore para Spendly

## Reglas de Seguridad de Firestore

Para implementar las reglas de seguridad de Firestore, sigue estos pasos:

### 1. Acceder a la Consola de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto Spendly
3. En el menú lateral, ve a "Firestore Database"
4. Haz clic en la pestaña "Reglas"

### 2. Implementar las Reglas
1. Copia el contenido del archivo `firestore.rules`
2. Pégalo en el editor de reglas de Firebase Console
3. Haz clic en "Publicar" para aplicar las reglas

### 3. Estructura de Datos

#### Colección `users`
```javascript
{
  uid: string,           // ID del usuario (mismo que auth.uid)
  email: string,         // Email del usuario
  displayName: string,   // Nombre para mostrar
  createdAt: timestamp,  // Fecha de creación
  updatedAt: timestamp   // Fecha de última actualización
}
```

#### Colección `transactions`
```javascript
{
  userId: string,          // UID del usuario (obligatorio)
  type: "gasto"|"ingreso", // Tipo de transacción
  category: string,        // Categoría principal
  subcategory: string,     // Subcategoría (opcional)
  amount: number,          // Monto (positivo)
  description: string,     // Descripción
  date: string,            // Fecha en formato 'YYYY-MM-DD'
  paymentMethod: string,   // Método de pago
  installments: number,    // Número de cuotas (opcional)
  installmentsPaid: number,// Cuotas pagadas (opcional)
  createdAt: timestamp,    // Fecha de creación
  updatedAt: timestamp     // Fecha de actualización
}
```

## Funcionalidades Implementadas

### ✅ Servicios
- **firestoreService.js**: CRUD completo para transacciones
- **authService.js**: Autenticación de usuarios (ya existía)

### ✅ Stores (Pinia)
- **userStore.js**: Gestión del estado de autenticación
- **transactionStore.js**: Gestión del estado de transacciones

### ✅ Componentes
- **TransactionForm.vue**: Formulario para crear/editar transacciones
- **TransactionTable.vue**: Tabla para mostrar y gestionar transacciones
- **MovimientosView.vue**: Vista principal con dashboard de transacciones

### ✅ Router Guards
- Protección de rutas autenticadas
- Redirección automática según estado de autenticación
- Gestión de títulos de página

## Cómo Usar el Sistema

### 1. Crear una Transacción
1. Ve a la sección "Movimientos"
2. Haz clic en "Nueva Transacción"
3. Completa el formulario
4. Haz clic en "Guardar"

### 2. Editar una Transacción
1. En la tabla de transacciones, haz clic en el ícono de editar
2. Modifica los campos necesarios
3. Haz clic en "Actualizar"

### 3. Eliminar una Transacción
1. En la tabla de transacciones, haz clic en el ícono de eliminar
2. Confirma la eliminación en el diálogo

### 4. Filtrar Transacciones
- Usa los botones de filtro (Todas, Ingresos, Gastos)
- Usa la barra de búsqueda en la tabla
- Los filtros se pueden combinar

## Características del Dashboard

### Tarjetas de Resumen
- **Balance Total**: Diferencia entre ingresos y gastos
- **Total Ingresos**: Suma de todas las transacciones de tipo "ingreso"
- **Total Gastos**: Suma de todas las transacciones de tipo "gasto"
- **Transacciones**: Número total de transacciones

### Tabla de Transacciones
- Paginación automática
- Búsqueda en tiempo real
- Ordenamiento por columnas
- Acciones de editar/eliminar por fila
- Formato de moneda automático
- Indicadores visuales por tipo de transacción

## Seguridad

Las reglas de Firestore garantizan que:
- Los usuarios solo pueden acceder a sus propias transacciones
- Los datos están validados antes de ser guardados
- Se requiere autenticación para todas las operaciones
- Los campos obligatorios están presentes
- Los tipos de datos son correctos

## Próximos Pasos

1. **Implementar las reglas de Firestore** siguiendo las instrucciones arriba
2. **Probar la funcionalidad completa** en el navegador
3. **Agregar categorías personalizadas** (opcional)
4. **Implementar reportes y gráficos** (futuro)
5. **Agregar exportación de datos** (futuro)