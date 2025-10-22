<script setup>
</script>

<template>
  <div class="auth">
    <div class="auth__container">
      <div class="auth__brand-section">
        <slot name="brand" />
      </div>
      
      <div class="auth__form-section">
        <div class="auth__card">
          <slot name="form" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>