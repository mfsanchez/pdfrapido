// WebMCP: expone las herramientas de PDFRápido a agentes de IA en el navegador
// https://webmachinelearning.github.io/webmcp/
(function () {
  if (!('modelContext' in navigator)) return;

  async function fetchBlob(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo obtener el archivo: ' + res.status);
    return res.blob();
  }

  async function callApi(endpoint, blob, extra) {
    const form = new FormData();
    form.append('file', blob, 'documento.pdf');
    if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v));
    const res = await fetch(endpoint, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Error en la API: ' + res.status);
    const ct = res.headers.get('Content-Type') || '';
    if (ct.includes('application/json')) return res.json();
    if (ct.includes('text/')) return { resultado: await res.text() };
    const out = await res.blob();
    return { tipo: ct, tamano_bytes: out.size, mensaje: 'Archivo generado correctamente' };
  }

  navigator.modelContext.provideContext({
    tools: [
      {
        name: 'pdfrapido_ocr',
        description: 'Extrae texto seleccionable de un PDF escaneado usando OCR.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF escaneado' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => callApi('/api/ocr-a-pdf', await fetchBlob(pdf_url))
      },
      {
        name: 'pdfrapido_resumir',
        description: 'Resume el contenido de un documento PDF con inteligencia artificial.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF a resumir' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => callApi('/api/resumir-pdf', await fetchBlob(pdf_url))
      },
      {
        name: 'pdfrapido_chat',
        description: 'Responde preguntas sobre el contenido de un PDF.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF' },
            pregunta: { type: 'string', description: 'Pregunta sobre el documento' }
          },
          required: ['pdf_url', 'pregunta']
        },
        execute: async ({ pdf_url, pregunta }) =>
          callApi('/api/chat-pdf', await fetchBlob(pdf_url), { pregunta })
      },
      {
        name: 'pdfrapido_traducir',
        description: 'Traduce un PDF a otro idioma manteniendo el formato.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF a traducir' },
            idioma: { type: 'string', description: 'Idioma destino (ej: inglés, francés, alemán)' }
          },
          required: ['pdf_url', 'idioma']
        },
        execute: async ({ pdf_url, idioma }) =>
          callApi('/api/traducir-pdf', await fetchBlob(pdf_url), { idioma })
      },
      {
        name: 'pdfrapido_extraer_datos',
        description: 'Extrae datos estructurados (tablas, campos, valores) de un PDF.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF del que extraer datos' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => callApi('/api/extraer-datos', await fetchBlob(pdf_url))
      },
      {
        name: 'pdfrapido_corregir',
        description: 'Corrige gramática y ortografía en un documento PDF.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF a corregir' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => callApi('/api/corregir-pdf', await fetchBlob(pdf_url))
      },
      {
        name: 'pdfrapido_redactar',
        description: 'Genera un documento PDF a partir de instrucciones en lenguaje natural.',
        inputSchema: {
          type: 'object',
          properties: {
            instrucciones: { type: 'string', description: 'Texto o instrucciones para generar el PDF' }
          },
          required: ['instrucciones']
        },
        execute: async ({ instrucciones }) => {
          const form = new FormData();
          form.append('prompt', instrucciones);
          const res = await fetch('/api/redactar-pdf', { method: 'POST', body: form });
          if (!res.ok) throw new Error('Error: ' + res.status);
          const out = await res.blob();
          return { tipo: res.headers.get('Content-Type'), tamano_bytes: out.size };
        }
      },
      {
        name: 'pdfrapido_pdf_a_audio',
        description: 'Convierte el texto de un PDF en audio MP3 con text-to-speech.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF a convertir en audio' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => callApi('/api/pdf-a-audio', await fetchBlob(pdf_url))
      },
      {
        name: 'pdfrapido_pdf_a_imagen',
        description: 'Convierte páginas de un PDF a imágenes PNG.',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF a convertir en imágenes' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => callApi('/api/pdf-a-png', await fetchBlob(pdf_url))
      },
      {
        name: 'pdfrapido_comprimir',
        description: 'Comprime un PDF en el navegador sin enviar el archivo al servidor (privacidad total).',
        inputSchema: {
          type: 'object',
          properties: {
            pdf_url: { type: 'string', description: 'URL del PDF a comprimir' }
          },
          required: ['pdf_url']
        },
        execute: async ({ pdf_url }) => ({
          herramienta_url: 'https://pdfrapido.eu/comprimir-pdf/',
          mensaje: 'La compresión se realiza en el navegador. Abre la URL y carga el archivo para comprimir.'
        })
      }
    ]
  });
})();
