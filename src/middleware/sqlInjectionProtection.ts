import { Request, Response, NextFunction } from 'express';

// Patrones de inyección SQL más comunes
const SQL_INJECTION_PATTERNS = [
  // Comandos SQL básicos
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
  
  // Comentarios SQL
  /(--|\/\*|\*\/)/g,
  
  // Operadores SQL
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
  
  // Funciones SQL peligrosas
  /(\b(CHAR|ASCII|SUBSTRING|LEN|LENGTH|CONCAT|CAST|CONVERT)\s*\()/gi,
  /(\b(WAITFOR|DELAY|BENCHMARK|SLEEP)\s*\()/gi,
  
  // Inyección de caracteres especiales
  /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(UNION|OR|AND)\b)/gi,
  
  // Patrones de escape
  /(\\x[0-9a-fA-F]{2})/g,
  /(%[0-9a-fA-F]{2})/g,
  
  // Comillas y escapes
  /(['"]\s*(OR|AND)\s*['"])/gi,
  /(\\['"])/g,
  
  // Time-based attacks
  /(\b(SLEEP|WAITFOR|DELAY)\s*\(\s*\d+\s*\))/gi,
  
  // Boolean-based attacks
  /(\b(OR|AND)\s+\d+\s*=\s*\d+\s*(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  
  // Error-based attacks
  /(\b(EXTRACTVALUE|UPDATEXML|EXP|POW|FLOOR|RAND)\s*\()/gi,
  
  // Stacked queries
  /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER))/gi,
  
  // Blind injection patterns
  /(\b(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/gi,
  /(\b(OR|AND)\s+['"]?\w+['"]?\s*LIKE\s*['"]?%['"]?)/gi,
  
  // NoSQL injection patterns
  /(\$where|\$regex|\$ne|\$gt|\$lt|\$in|\$nin)/gi,
  /(\{\s*\$where|\{\s*\$regex|\{\s*\$ne)/gi,
  
  // XPath injection
  /(\b(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?\s*OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/gi,
  
  // LDAP injection
  /(\*\)|\(\*|\*\)\s*\(|\*\)\s*\))/gi,
  
  // Command injection
  /(\||&|;|\$\(|\`)/g,
  
  // Path traversal
  /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
  
  // Null byte injection
  /(%00|\x00)/g,
  
  // Encoding attacks
  /(%[0-9a-fA-F]{2}){2,}/g,
  
  // Unicode attacks
  /(\\u[0-9a-fA-F]{4})/g,
  
  // Hex encoding
  /(0x[0-9a-fA-F]+)/gi,
  
  // Binary encoding
  /(b'[01]+')/gi,
  
  // String concatenation
  /(\+\s*['"]|['"]\s*\+)/gi,
  
  // Subquery patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
  
  // Function calls
  /(\b(USER|DATABASE|VERSION|SCHEMA|TABLE_NAME|COLUMN_NAME)\s*\(\))/gi,
  
  // Information schema
  /(\b(INFORMATION_SCHEMA|SYS\.|MYSQL\.|PG_)\b)/gi,
  
  // System functions
  /(\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b)/gi,
  
  // Privilege escalation
  /(\b(GRANT|REVOKE|PRIVILEGES)\b)/gi,
  
  // Database manipulation
  /(\b(TRUNCATE|REPLACE|MERGE|UPSERT)\b)/gi,
  
  // Advanced patterns
  /(\b(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?\s*(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/gi,
  
  // Nested queries
  /(\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
  
  // Complex injection patterns
  /(\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?\s*(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
];

// Patrones de NoSQL injection
const NOSQL_INJECTION_PATTERNS = [
  /(\$where|\$regex|\$ne|\$gt|\$lt|\$in|\$nin|\$exists|\$or|\$and)/gi,
  /(\{\s*\$where|\{\s*\$regex|\{\s*\$ne|\{\s*\$gt|\{\s*\$lt)/gi,
  /(\$where\s*:|\$regex\s*:|\$ne\s*:|\$gt\s*:|\$lt\s*:)/gi,
];

// Patrones de XSS
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<script[^>]*>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<style[^>]*>.*?<\/style>/gi,
  /<link[^>]*>/gi,
  /<form[^>]*>.*?<\/form>/gi,
  /<input[^>]*>/gi,
  /<textarea[^>]*>.*?<\/textarea>/gi,
  /<select[^>]*>.*?<\/select>/gi,
  /<option[^>]*>.*?<\/option>/gi,
  /<button[^>]*>.*?<\/button>/gi,
  /<a[^>]*>.*?<\/a>/gi,
  /<img[^>]*>/gi,
  /<video[^>]*>.*?<\/video>/gi,
  /<audio[^>]*>.*?<\/audio>/gi,
  /<source[^>]*>/gi,
  /<track[^>]*>/gi,
  /<canvas[^>]*>.*?<\/canvas>/gi,
  /<svg[^>]*>.*?<\/svg>/gi,
  /<math[^>]*>.*?<\/math>/gi,
  /<table[^>]*>.*?<\/table>/gi,
  /<tr[^>]*>.*?<\/tr>/gi,
  /<td[^>]*>.*?<\/td>/gi,
  /<th[^>]*>.*?<\/th>/gi,
  /<thead[^>]*>.*?<\/thead>/gi,
  /<tbody[^>]*>.*?<\/tbody>/gi,
  /<tfoot[^>]*>.*?<\/tfoot>/gi,
  /<col[^>]*>/gi,
  /<colgroup[^>]*>.*?<\/colgroup>/gi,
  /<caption[^>]*>.*?<\/caption>/gi,
  /<fieldset[^>]*>.*?<\/fieldset>/gi,
  /<legend[^>]*>.*?<\/legend>/gi,
  /<label[^>]*>.*?<\/label>/gi,
  /<output[^>]*>.*?<\/output>/gi,
  /<progress[^>]*>.*?<\/progress>/gi,
  /<meter[^>]*>.*?<\/meter>/gi,
  /<details[^>]*>.*?<\/details>/gi,
  /<summary[^>]*>.*?<\/summary>/gi,
  /<dialog[^>]*>.*?<\/dialog>/gi,
  /<menu[^>]*>.*?<\/menu>/gi,
  /<menuitem[^>]*>.*?<\/menuitem>/gi,
  /<command[^>]*>.*?<\/command>/gi,
  /<keygen[^>]*>.*?<\/keygen>/gi,
  /<datalist[^>]*>.*?<\/datalist>/gi,
  /<optgroup[^>]*>.*?<\/optgroup>/gi,
  /<area[^>]*>/gi,
  /<base[^>]*>/gi,
  /<br[^>]*>/gi,
  /<hr[^>]*>/gi,
  /<wbr[^>]*>/gi,
  /<bdi[^>]*>.*?<\/bdi>/gi,
  /<bdo[^>]*>.*?<\/bdo>/gi,
  /<cite[^>]*>.*?<\/cite>/gi,
  /<code[^>]*>.*?<\/code>/gi,
  /<dfn[^>]*>.*?<\/dfn>/gi,
  /<em[^>]*>.*?<\/em>/gi,
  /<i[^>]*>.*?<\/i>/gi,
  /<kbd[^>]*>.*?<\/kbd>/gi,
  /<mark[^>]*>.*?<\/mark>/gi,
  /<q[^>]*>.*?<\/q>/gi,
  /<rp[^>]*>.*?<\/rp>/gi,
  /<rt[^>]*>.*?<\/rt>/gi,
  /<ruby[^>]*>.*?<\/ruby>/gi,
  /<s[^>]*>.*?<\/s>/gi,
  /<samp[^>]*>.*?<\/samp>/gi,
  /<small[^>]*>.*?<\/small>/gi,
  /<span[^>]*>.*?<\/span>/gi,
  /<strong[^>]*>.*?<\/strong>/gi,
  /<sub[^>]*>.*?<\/sub>/gi,
  /<sup[^>]*>.*?<\/sup>/gi,
  /<time[^>]*>.*?<\/time>/gi,
  /<u[^>]*>.*?<\/u>/gi,
  /<var[^>]*>.*?<\/var>/gi,
  /<wbr[^>]*>/gi,
];

// Función para detectar inyecciones SQL
export const detectSQLInjection = (input: any): boolean => {
  if (typeof input === 'string') {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }
  
  if (typeof input === 'object' && input !== null) {
    return Object.values(input).some(detectSQLInjection);
  }
  
  return false;
};

// Función para detectar inyecciones NoSQL
export const detectNoSQLInjection = (input: any): boolean => {
  if (typeof input === 'string') {
    return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }
  
  if (typeof input === 'object' && input !== null) {
    return Object.values(input).some(detectNoSQLInjection);
  }
  
  return false;
};

// Función para detectar XSS
export const detectXSS = (input: any): boolean => {
  if (typeof input === 'string') {
    return XSS_PATTERNS.some(pattern => pattern.test(input));
  }
  
  if (typeof input === 'object' && input !== null) {
    return Object.values(input).some(detectXSS);
  }
  
  return false;
};

// Middleware principal de protección
export const sqlInjectionProtection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar body
    if (req.body && Object.keys(req.body).length > 0) {
      if (detectSQLInjection(req.body)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en el cuerpo de la petición',
          code: 'SQL_INJECTION_DETECTED'
        });
      }
      
      if (detectNoSQLInjection(req.body)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en el cuerpo de la petición',
          code: 'NOSQL_INJECTION_DETECTED'
        });
      }
      
      if (detectXSS(req.body)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en el cuerpo de la petición',
          code: 'XSS_DETECTED'
        });
      }
    }
    
    // Verificar query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      if (detectSQLInjection(req.query)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en los parámetros de consulta',
          code: 'SQL_INJECTION_DETECTED'
        });
      }
      
      if (detectNoSQLInjection(req.query)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en los parámetros de consulta',
          code: 'NOSQL_INJECTION_DETECTED'
        });
      }
      
      if (detectXSS(req.query)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en los parámetros de consulta',
          code: 'XSS_DETECTED'
        });
      }
    }
    
    // Verificar parámetros de ruta
    if (req.params && Object.keys(req.params).length > 0) {
      if (detectSQLInjection(req.params)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en los parámetros de ruta',
          code: 'SQL_INJECTION_DETECTED'
        });
      }
      
      if (detectNoSQLInjection(req.params)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en los parámetros de ruta',
          code: 'NOSQL_INJECTION_DETECTED'
        });
      }
      
      if (detectXSS(req.params)) {
        return res.status(400).json({
          success: false,
          error: 'Contenido sospechoso detectado en los parámetros de ruta',
          code: 'XSS_DETECTED'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en protección SQL:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno de seguridad',
      code: 'SECURITY_ERROR'
    });
  }
};

// Función para sanitizar inputs de manera inteligente
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Solo remover caracteres realmente peligrosos
    return input
      // Remover solo scripts y XSS peligrosos
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remover scripts completos
      .replace(/<script[^>]*>/gi, '') // Remover tags script
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+\s*=/gi, '') // Remover event handlers
      .replace(/<iframe[^>]*>/gi, '') // Remover iframes
      .replace(/<object[^>]*>/gi, '') // Remover objects
      .replace(/<embed[^>]*>/gi, '') // Remover embeds
      
      // Remover solo caracteres SQL injection peligrosos
      .replace(/union\s+select/gi, '') // Remover UNION SELECT
      .replace(/drop\s+table/gi, '') // Remover DROP TABLE
      .replace(/delete\s+from/gi, '') // Remover DELETE FROM
      .replace(/insert\s+into/gi, '') // Remover INSERT INTO
      .replace(/update\s+set/gi, '') // Remover UPDATE SET
      .replace(/exec\s*\(/gi, '') // Remover EXEC(
      .replace(/execute\s*\(/gi, '') // Remover EXECUTE(
      
      // Remover solo caracteres de comando injection
      .replace(/[|&`$]/g, '') // Remover pipes, ampersands, backticks, dollar
      .replace(/;\s*$/g, '') // Remover punto y coma al final
      
      // Remover solo caracteres de path traversal
      .replace(/\.\.\//g, '') // Remover ../
      .replace(/\.\.\\/g, '') // Remover ..\
      .replace(/\.\.%2f/gi, '') // Remover ..%2f
      .replace(/\.\.%5c/gi, '') // Remover ..%5c
      
      // Remover null bytes
      .replace(/\0/g, '') // Remover null bytes
      .replace(/%00/g, '') // Remover %00
      
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno
      .trim()
      .substring(0, 1000); // Limitar longitud
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  
  return input;
};

// Middleware para sanitizar inputs
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    
    // Sanitizar query parameters sin modificar el objeto original
    if (req.query && Object.keys(req.query).length > 0) {
      const sanitizedQuery = sanitizeInput(req.query);
      // Crear un nuevo objeto con los valores sanitizados
      Object.keys(sanitizedQuery).forEach(key => {
        if (sanitizedQuery[key] !== undefined) {
          (req as any).query[key] = sanitizedQuery[key];
        }
      });
    }
    
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Error en sanitizeInputs:', error);
    next();
  }
};
