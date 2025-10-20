<script setup>
// Layout de autenticación con diseño de dos columnas
</script>

<template>
  <div class="auth">
    <div class="auth__container">
      <!-- Sección izquierda: Logo y descripción -->
      <div class="auth__brand-section">
        <slot name="brand" />
      </div>
      
      <!-- Sección derecha: Formulario -->
      <div class="auth__form-section">
        <div class="auth__card">
          <slot name="form" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Los estilos están en auth.css para aprovechar las animaciones y efectos modernos */
</style>