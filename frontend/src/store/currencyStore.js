import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCurrencyStore = defineStore('currency', () => {
  // State
  const currentCurrency = ref('USD')
  const exchangeRates = ref({
    USD: 1,
    CLP: 950,
    EUR: 0.85,
    GBP: 0.73,
    CAD: 1.35,
    ARS: 350,
    MXN: 18,
    BRL: 5.2,
    COP: 4200,
    PEN: 3.8
  })
  const lastUpdated = ref(null)
  const isLoading = ref(false)

  // Available currencies with their details
  const availableCurrencies = ref([
    {
      code: 'USD',
      name: 'Dólar Estadounidense',
      symbol: '$',
      locale: 'en-US',
      flag: '🇺🇸'
    },
    {
      code: 'CLP',
      name: 'Peso Chileno',
      symbol: '$',
      locale: 'es-CL',
      flag: '🇨🇱'
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      locale: 'de-DE',
      flag: '🇪🇺'
    },
    {
      code: 'GBP',
      name: 'Libra Esterlina',
      symbol: '£',
      locale: 'en-GB',
      flag: '🇬🇧'
    },
    {
      code: 'CAD',
      name: 'Dólar Canadiense',
      symbol: 'C$',
      locale: 'en-CA',
      flag: '🇨🇦'
    },
    {
      code: 'ARS',
      name: 'Peso Argentino',
      symbol: '$',
      locale: 'es-AR',
      flag: '🇦🇷'
    },
    {
      code: 'MXN',
      name: 'Peso Mexicano',
      symbol: '$',
      locale: 'es-MX',
      flag: '🇲🇽'
    },
    {
      code: 'BRL',
      name: 'Real Brasileño',
      symbol: 'R$',
      locale: 'pt-BR',
      flag: '🇧🇷'
    },
    {
      code: 'COP',
      name: 'Peso Colombiano',
      symbol: '$',
      locale: 'es-CO',
      flag: '🇨🇴'
    },
    {
      code: 'PEN',
      name: 'Sol Peruano',
      symbol: 'S/',
      locale: 'es-PE',
      flag: '🇵🇪'
    }
  ])

  // Computed
  const currentCurrencyInfo = computed(() => {
    return availableCurrencies.value.find(c => c.code === currentCurrency.value) || availableCurrencies.value[0]
  })

  const currentExchangeRate = computed(() => {
    return exchangeRates.value[currentCurrency.value] || 1
  })

  // Actions
  function setCurrency(currencyCode) {
    if (availableCurrencies.value.find(c => c.code === currencyCode)) {
      currentCurrency.value = currencyCode
      // Save to localStorage
      localStorage.setItem('spendly_currency', currencyCode)
    }
  }

  function convertAmount(amount, fromCurrency = 'USD', toCurrency = null) {
    if (!toCurrency) {
      toCurrency = currentCurrency.value
    }

    if (fromCurrency === toCurrency) {
      return amount
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / (exchangeRates.value[fromCurrency] || 1)
    const convertedAmount = usdAmount * (exchangeRates.value[toCurrency] || 1)
    
    return convertedAmount
  }

  function formatAmount(amount, currencyCode = null, options = {}) {
    const currency = currencyCode || currentCurrency.value
    const currencyInfo = availableCurrencies.value.find(c => c.code === currency)
    
    if (!currencyInfo) {
      return amount.toString()
    }

    const defaultOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'CLP' ? 0 : 2,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2
    }

    const formatOptions = { ...defaultOptions, ...options }

    try {
      return new Intl.NumberFormat(currencyInfo.locale, formatOptions).format(amount)
    } catch (error) {
      // Fallback formatting
      const symbol = currencyInfo.symbol
      const formattedNumber = amount.toLocaleString(currencyInfo.locale, {
        minimumFractionDigits: formatOptions.minimumFractionDigits,
        maximumFractionDigits: formatOptions.maximumFractionDigits
      })
      return `${symbol}${formattedNumber}`
    }
  }

  function formatAmountWithConversion(amount, fromCurrency = 'USD', showOriginal = false) {
    const convertedAmount = convertAmount(amount, fromCurrency, currentCurrency.value)
    const formatted = formatAmount(convertedAmount)
    
    if (showOriginal && fromCurrency !== currentCurrency.value) {
      const originalFormatted = formatAmount(amount, fromCurrency)
      return `${formatted} (${originalFormatted})`
    }
    
    return formatted
  }

  async function updateExchangeRates() {
    isLoading.value = true
    try {
      // Using a free API for exchange rates
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await response.json()
      
      if (data.rates) {
        // Update rates for supported currencies
        Object.keys(exchangeRates.value).forEach(currency => {
          if (data.rates[currency]) {
            exchangeRates.value[currency] = data.rates[currency]
          }
        })
        
        lastUpdated.value = new Date().toISOString()
        localStorage.setItem('spendly_exchange_rates', JSON.stringify({
          rates: exchangeRates.value,
          lastUpdated: lastUpdated.value
        }))
      }
    } catch (error) {
      console.warn('Failed to update exchange rates:', error)
      // Use cached rates if available
      loadCachedRates()
    } finally {
      isLoading.value = false
    }
  }

  function loadCachedRates() {
    try {
      const cached = localStorage.getItem('spendly_exchange_rates')
      if (cached) {
        const data = JSON.parse(cached)
        exchangeRates.value = { ...exchangeRates.value, ...data.rates }
        lastUpdated.value = data.lastUpdated
      }
    } catch (error) {
      console.warn('Failed to load cached exchange rates:', error)
    }
  }

  function initializeCurrency() {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('spendly_currency')
    if (savedCurrency && availableCurrencies.value.find(c => c.code === savedCurrency)) {
      currentCurrency.value = savedCurrency
    }

    // Load cached exchange rates
    loadCachedRates()

    // Update rates if they're older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    if (!lastUpdated.value || lastUpdated.value < oneHourAgo) {
      updateExchangeRates()
    }
  }

  function getExchangeRateInfo() {
    return {
      lastUpdated: lastUpdated.value,
      isLoading: isLoading.value,
      rates: exchangeRates.value
    }
  }

  // Initialize on store creation
  initializeCurrency()

  return {
    // State
    currentCurrency,
    exchangeRates,
    lastUpdated,
    isLoading,
    availableCurrencies,
    
    // Computed
    currentCurrencyInfo,
    currentExchangeRate,
    
    // Actions
    setCurrency,
    convertAmount,
    formatAmount,
    formatAmountWithConversion,
    updateExchangeRates,
    initializeCurrency,
    getExchangeRateInfo
  }
})