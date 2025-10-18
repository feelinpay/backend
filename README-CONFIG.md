# 🔧 Configuración Completa del Sistema

## 📋 Variables de Entorno Requeridas

Copia y pega este contenido en tu archivo `.env`:

```env
# ===========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===========================================
DATABASE_URL="file:./feelin_pay.db"

# ===========================================
# CONFIGURACIÓN DEL SERVIDOR
# ===========================================
PORT=3001
NODE_ENV=development

# ===========================================
# CONFIGURACIÓN DE JWT
# ===========================================
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui_cambiar_en_produccion"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# ===========================================
# CONFIGURACIÓN DE EMAIL (GMAIL)
# ===========================================
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="tu_email@gmail.com"
EMAIL_PASS="tu_app_password_de_gmail"
EMAIL_FROM="Feelin Pay <tu_email@gmail.com>"
EMAIL_FROM_NAME="Feelin Pay"

# ===========================================
# CONFIGURACIÓN DE OTP
# ===========================================
# Tiempo de validez del código OTP en minutos
OTP_EXPIRATION_MINUTES=10
# Número máximo de intentos de OTP por día
OTP_MAX_ATTEMPTS_PER_DAY=5
# Número máximo de intentos de verificación por código
OTP_MAX_VERIFICATION_ATTEMPTS=3
# Intervalo mínimo entre solicitudes de OTP en minutos
OTP_MIN_INTERVAL_MINUTES=5

# ===========================================
# CONFIGURACIÓN DE LIMPIEZA AUTOMÁTICA
# ===========================================
# Días para eliminar usuarios no verificados
UNVERIFIED_USER_CLEANUP_DAYS=7
# Intervalo de limpieza de OTPs expirados en minutos
OTP_CLEANUP_INTERVAL_MINUTES=30
# Hora para resetear intentos diarios (formato 24h)
DAILY_RESET_HOUR=2

# ===========================================
# CONFIGURACIÓN DE SEGURIDAD
# ===========================================
# Rate limiting - requests por minuto
RATE_LIMIT_REQUESTS_PER_MINUTE=100
# Rate limiting - requests por hora
RATE_LIMIT_REQUESTS_PER_HOUR=1000
# Tiempo de bloqueo por exceso de intentos en minutos
BLOCK_DURATION_MINUTES=15
# Número máximo de intentos de login fallidos
MAX_LOGIN_ATTEMPTS=5

# ===========================================
# CONFIGURACIÓN DE MEMBRESÍAS
# ===========================================
# Días de prueba gratuita para nuevos usuarios
TRIAL_DAYS=3
# Precio de membresía mensual (en soles)
MONTHLY_MEMBERSHIP_PRICE=29.90

# ===========================================
# CONFIGURACIÓN DE SMS (OPCIONAL)
# ===========================================
SMS_ENABLED=false
SMS_PROVIDER="twilio"
SMS_ACCOUNT_SID=""
SMS_AUTH_TOKEN=""
SMS_FROM_NUMBER=""

# ===========================================
# CONFIGURACIÓN DE GOOGLE SHEETS (OPCIONAL)
# ===========================================
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SHEETS_CREDENTIALS_PATH=""
GOOGLE_SHEETS_SPREADSHEET_ID=""

# ===========================================
# CONFIGURACIÓN DE LOGS
# ===========================================
LOG_LEVEL="info"
LOG_FILE_ENABLED=false
LOG_FILE_PATH="./logs/app.log"

# ===========================================
# CONFIGURACIÓN DE DESARROLLO
# ===========================================
# Habilitar logs detallados en desarrollo
DEBUG_MODE=true
# Habilitar limpieza automática en desarrollo
AUTO_CLEANUP_ENABLED=true
# Habilitar jobs programados
SCHEDULED_JOBS_ENABLED=true
```

## 🚀 Características Implementadas

### ✅ **Sistema OTP Robusto**
- **Un solo código por usuario**: Se elimina el anterior al generar uno nuevo
- **Tiempo de validez configurable**: Por defecto 10 minutos
- **Intentos diarios limitados**: 5 códigos por día por usuario
- **Eliminación automática**: Los códigos se eliminan después de ser usados
- **Reset diario**: Los intentos se resetean automáticamente cada día

### ✅ **Limpieza Automática**
- **Usuarios no verificados**: Se eliminan después de 7 días (configurable)
- **OTPs expirados**: Se limpian cada 30 minutos (configurable)
- **Reset de intentos**: Se ejecuta diariamente a las 2:00 AM (configurable)

### ✅ **Seguridad Avanzada**
- **Rate limiting**: Protección contra ataques de fuerza bruta
- **Sanitización inteligente**: Previene SQL injection y XSS
- **Bloqueo temporal**: Por exceso de intentos fallidos
- **Validación robusta**: Con Zod para todos los inputs

### ✅ **Configuración Flexible**
- **Variables de entorno**: Todo configurable desde `.env`
- **Modo desarrollo/producción**: Configuraciones específicas
- **Logs detallados**: Para debugging y monitoreo
- **Jobs programados**: Limpieza automática configurable

## 🔧 Configuraciones Importantes

### **OTP (Códigos de Verificación)**
```env
OTP_EXPIRATION_MINUTES=10          # Tiempo de validez
OTP_MAX_ATTEMPTS_PER_DAY=5         # Máximo 5 códigos por día
OTP_MAX_VERIFICATION_ATTEMPTS=3    # Máximo 3 intentos por código
OTP_MIN_INTERVAL_MINUTES=5         # Intervalo mínimo entre solicitudes
```

### **Limpieza Automática**
```env
UNVERIFIED_USER_CLEANUP_DAYS=7     # Eliminar usuarios no verificados
OTP_CLEANUP_INTERVAL_MINUTES=30    # Limpiar OTPs expirados
DAILY_RESET_HOUR=2                 # Hora de reset diario (2:00 AM)
```

### **Seguridad**
```env
RATE_LIMIT_REQUESTS_PER_MINUTE=100 # Límite por minuto
RATE_LIMIT_REQUESTS_PER_HOUR=1000  # Límite por hora
BLOCK_DURATION_MINUTES=15          # Tiempo de bloqueo
MAX_LOGIN_ATTEMPTS=5               # Intentos de login
```

## 📊 Monitoreo y Logs

El sistema incluye logs detallados para:
- ✅ Generación y uso de códigos OTP
- ✅ Limpieza automática de datos
- ✅ Intentos de acceso fallidos
- ✅ Estadísticas de usuarios
- ✅ Errores y excepciones

## 🚀 Inicio Rápido

1. **Copia el archivo `.env`** con la configuración de arriba
2. **Configura tu email** con las credenciales de Gmail
3. **Ejecuta el servidor**: `npm run dev`
4. **Los jobs automáticos se iniciarán** automáticamente

¡El sistema está completamente configurado y listo para usar! 🎉
