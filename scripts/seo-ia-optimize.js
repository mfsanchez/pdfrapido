#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TOOLS = [
  {
    slug: 'comprimir-pdf',
    name: 'Comprimir PDF',
    action: 'comprimir',
    category: 'Optimizar PDF',
    categorySlug: 'optimizar-pdf',
    privacyType: 'local',
    featureList: 'Compresión con 3 niveles de calidad, Procesamiento local en navegador, Reducción de tamaño hasta 80%, Comparación visual de tamaños, Sin límite de archivos',
    title: 'Comprimir PDF Gratis Online | PDFRápido',
    description: 'Comprime PDF gratis y reduce su tamaño hasta un 80% sin perder calidad. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Comprimir PDF Gratis Online | PDFRápido',
    ogDesc: 'Reduce el tamaño de tu PDF hasta un 80% sin perder calidad visible. Sin registro, sin instalar nada.',
    answerFirst: 'PDFRápido te permite comprimir archivos PDF reduciendo su tamaño hasta un 80% sin pérdida visible de calidad. El procesamiento es instantáneo en tu navegador. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Compresión local en navegador con 3 niveles','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Reduce hasta un 80% el tamaño del PDF'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona tu PDF en el área de carga. Sin límite de tamaño.' },
      { strong: 'Elige el nivel', text: 'Selecciona compresión suave, recomendada o máxima según tus necesidades.' },
      { strong: 'Descarga', text: 'Guarda tu PDF comprimido en segundos, con comparación visual de tamaños.' }
    ],
    faqs: [
      { q: '¿Cómo comprimir un PDF gratis online?', a: 'PDFRápido te permite comprimir archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro comprimir PDFs con PDFRápido?', a: 'Sí, la compresión se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Comprimir PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Comprimir PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Unir PDF',slug:'unir-pdf'},{name:'Dividir PDF',slug:'dividir-pdf'},{name:'PDF a Word',slug:'pdf-a-word'}]
  },
  {
    slug: 'unir-pdf',
    name: 'Unir PDF',
    action: 'unir',
    category: 'Organizar PDF',
    categorySlug: 'organizar-pdf',
    privacyType: 'local',
    featureList: 'Unión ilimitada de archivos, Arrastrar y ordenar páginas, Procesamiento local en navegador, Conserva marcadores e hipervínculos, Sin límite de archivos',
    title: 'Unir PDF Gratis Online | PDFRápido',
    description: 'Une varios PDF en uno solo gratis y sin registro. Combina, ordena y descarga en segundos. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Unir PDF Gratis Online | PDFRápido',
    ogDesc: 'Combina varios PDFs en uno solo gratis. Arrastra, ordena y descarga en segundos. Sin registro.',
    answerFirst: 'PDFRápido te permite unir varios archivos PDF en un solo documento, arrastrando para ordenarlos como prefieras. El procesamiento es instantáneo en tu navegador. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Unión local en navegador con ordenación drag & drop','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Conserva marcadores e hipervínculos originales'],
    howItWorks: [
      { strong: 'Sube tus archivos', text: 'Arrastra o selecciona varios PDFs. Puedes añadir tantos como necesites.' },
      { strong: 'Ordena', text: 'Reorganiza el orden de los archivos arrastrándolos a la posición deseada.' },
      { strong: 'Descarga', text: 'Pulsa "Unir PDFs" y descarga el documento combinado en segundos.' }
    ],
    faqs: [
      { q: '¿Cómo unir un PDF gratis online?', a: 'PDFRápido te permite unir archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro unir PDFs con PDFRápido?', a: 'Sí, la unión se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Unir PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Unir PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Dividir PDF',slug:'dividir-pdf'},{name:'Comprimir PDF',slug:'comprimir-pdf'},{name:'Extraer páginas',slug:'extraer-paginas'}]
  },
  {
    slug: 'dividir-pdf',
    name: 'Dividir PDF',
    action: 'dividir',
    category: 'Organizar PDF',
    categorySlug: 'organizar-pdf',
    privacyType: 'local',
    featureList: 'División por rangos o páginas individuales, Vista previa de miniaturas, Procesamiento local en navegador, Descarga individual o en ZIP, Sin límite de páginas',
    title: 'Dividir PDF Gratis Online | PDFRápido',
    description: 'Divide un PDF en varios archivos gratis y sin registro. Separa por páginas o rangos. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Dividir PDF Gratis Online | PDFRápido',
    ogDesc: 'Separa páginas de tu PDF por rangos o individualmente. Gratis, sin registro, procesamiento local.',
    answerFirst: 'PDFRápido te permite dividir archivos PDF separando páginas por rangos o extrayendo páginas individuales con vista previa visual. El procesamiento es instantáneo en tu navegador. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','División local con vista previa de miniaturas','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Descarga individual o en archivo ZIP'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona el PDF que quieres dividir.' },
      { strong: 'Selecciona páginas', text: 'Elige rangos, páginas individuales o separa todas las páginas.' },
      { strong: 'Descarga', text: 'Obtén los archivos resultantes individualmente o en un ZIP.' }
    ],
    faqs: [
      { q: '¿Cómo dividir un PDF gratis online?', a: 'PDFRápido te permite dividir archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro dividir PDFs con PDFRápido?', a: 'Sí, la división se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Dividir PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Dividir PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Unir PDF',slug:'unir-pdf'},{name:'Extraer páginas',slug:'extraer-paginas'},{name:'Comprimir PDF',slug:'comprimir-pdf'}]
  },
  {
    slug: 'word-a-pdf',
    name: 'Word a PDF',
    action: 'convertir Word a',
    category: 'Convertir a PDF',
    categorySlug: 'convertir-a-pdf',
    privacyType: 'server',
    featureList: 'Conversión DOCX/DOC a PDF fiel, Mantiene tablas, imágenes y formato, Procesamiento rápido en servidor, Archivos eliminados en 10 minutos, Sin límite de conversiones',
    title: 'Convertir Word a PDF Gratis Online | PDFRápido',
    description: 'Convierte Word a PDF gratis y sin registro. DOC y DOCX a PDF con formato original. Gratuito, sin registro, procesamiento seguro. Prueba ahora.',
    ogTitle: 'Convertir Word a PDF Gratis Online | PDFRápido',
    ogDesc: 'Transforma documentos Word a PDF manteniendo el formato original. Gratis, sin registro.',
    answerFirst: 'PDFRápido te permite convertir documentos Word (DOC y DOCX) a PDF manteniendo el formato original, tablas e imágenes. El procesamiento es rápido y seguro en servidor. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Conversión fiel de DOCX/DOC a PDF','Archivos eliminados del servidor en 10 minutos','Funciona en PC, móvil y tablet','Conserva tablas, imágenes y formato original'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona tu documento Word (.doc o .docx).' },
      { strong: 'Convierte', text: 'La herramienta transforma el documento a PDF automáticamente.' },
      { strong: 'Descarga', text: 'Guarda tu PDF con el formato original conservado en segundos.' }
    ],
    faqs: [
      { q: '¿Cómo convertir Word a PDF gratis online?', a: 'PDFRápido te permite convertir archivos Word a PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es en servidor seguro y gratuito.' },
      { q: '¿Es seguro convertir Word a PDF con PDFRápido?', a: 'Sí, la conversión se realiza en nuestros servidores seguros y tu archivo se elimina automáticamente en menos de 10 minutos. Tus documentos nunca se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Word a PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Word a PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'PDF a Word',slug:'pdf-a-word'},{name:'Excel a PDF',slug:'excel-a-pdf'},{name:'PowerPoint a PDF',slug:'pptx-a-pdf'}]
  },
  {
    slug: 'pdf-a-word',
    name: 'PDF a Word',
    action: 'convertir PDF a',
    category: 'Convertir desde PDF',
    categorySlug: 'convertir-desde-pdf',
    privacyType: 'server',
    featureList: 'Conversión PDF a DOCX editable, Conserva texto, imágenes y tablas, Procesamiento rápido en servidor, Archivos eliminados en 10 minutos, Sin límite de conversiones',
    title: 'Convertir PDF a Word Gratis Online | PDFRápido',
    description: 'Convierte PDF a Word editable gratis y sin registro. PDF a DOCX con texto e imágenes conservados. Gratuito, sin registro, procesamiento seguro. Prueba ahora.',
    ogTitle: 'Convertir PDF a Word Gratis Online | PDFRápido',
    ogDesc: 'Transforma PDFs en documentos Word editables. Gratis, sin registro, procesamiento seguro.',
    answerFirst: 'PDFRápido te permite convertir archivos PDF a documentos Word editables (DOCX) conservando texto, imágenes y tablas. El procesamiento es rápido y seguro en servidor. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','PDF a DOCX editable con formato conservado','Archivos eliminados del servidor en 10 minutos','Funciona en PC, móvil y tablet','Texto, imágenes y tablas preservados'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona tu archivo PDF.' },
      { strong: 'Convierte', text: 'La herramienta extrae el contenido y genera un DOCX editable.' },
      { strong: 'Descarga', text: 'Guarda tu documento Word con texto e imágenes conservados.' }
    ],
    faqs: [
      { q: '¿Cómo convertir PDF a Word gratis online?', a: 'PDFRápido te permite convertir archivos PDF a Word directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es en servidor seguro y gratuito.' },
      { q: '¿Es seguro convertir PDF a Word con PDFRápido?', a: 'Sí, la conversión se realiza en nuestros servidores seguros y tu archivo se elimina automáticamente en menos de 10 minutos. Tus documentos nunca se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar PDF a Word?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona PDF a Word en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Word a PDF',slug:'word-a-pdf'},{name:'PDF a Excel',slug:'pdf-a-excel'},{name:'PDF a PowerPoint',slug:'pdf-a-pptx'}]
  },
  {
    slug: 'proteger-pdf',
    name: 'Proteger PDF',
    action: 'proteger',
    category: 'Seguridad PDF',
    categorySlug: 'seguridad-pdf',
    privacyType: 'local',
    featureList: 'Cifrado AES-128 de PDFs, Protección con contraseña personalizada, Procesamiento local en navegador, Sin límite de archivos protegidos, Compatible con todos los lectores PDF',
    title: 'Proteger PDF con Contraseña Gratis Online | PDFRápido',
    description: 'Protege PDF con contraseña gratis y sin registro. Cifrado AES seguro directamente en tu navegador. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Proteger PDF con Contraseña Gratis Online | PDFRápido',
    ogDesc: 'Añade contraseña a tus PDFs con cifrado AES. Gratis, sin registro, procesamiento local.',
    answerFirst: 'PDFRápido te permite proteger archivos PDF con contraseña usando cifrado AES-128 directamente en tu navegador. El procesamiento es instantáneo y privado. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Cifrado AES-128 local en navegador','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Compatible con todos los lectores PDF'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona el PDF que quieres proteger.' },
      { strong: 'Añade contraseña', text: 'Introduce la contraseña que deseas usar para proteger el archivo.' },
      { strong: 'Descarga', text: 'Guarda tu PDF cifrado. Ahora requerirá la contraseña para abrirse.' }
    ],
    faqs: [
      { q: '¿Cómo proteger un PDF gratis online?', a: 'PDFRápido te permite proteger archivos PDF con contraseña directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro proteger PDFs con PDFRápido?', a: 'Sí, el cifrado se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Proteger PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Proteger PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Desbloquear PDF',slug:'desbloquear-pdf'},{name:'Firmar PDF',slug:'firmar-pdf'},{name:'Comprimir PDF',slug:'comprimir-pdf'}]
  },
  {
    slug: 'editar-pdf',
    name: 'Editar PDF',
    action: 'editar',
    category: 'Editar PDF',
    categorySlug: 'editar-pdf',
    privacyType: 'local',
    featureList: 'Edición visual de PDFs online, Añade texto, formas y flechas, Procesamiento local en navegador, Sin marca de agua, Sin límite de archivos editados',
    title: 'Editar PDF Gratis Online | PDFRápido',
    description: 'Edita PDF gratis y sin registro. Añade texto, formas y anotaciones directamente en tu navegador. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Editar PDF Gratis Online | PDFRápido',
    ogDesc: 'Edita PDFs online añadiendo texto, formas y anotaciones. Gratis, sin registro, procesamiento local.',
    answerFirst: 'PDFRápido te permite editar archivos PDF añadiendo texto, formas, flechas y anotaciones directamente en tu navegador. El procesamiento es instantáneo y privado. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Edición visual local en navegador','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Sin marca de agua en el resultado'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona el PDF que quieres editar.' },
      { strong: 'Edita', text: 'Añade texto, formas, flechas y anotaciones sobre el documento.' },
      { strong: 'Descarga', text: 'Guarda tu PDF editado con todos los cambios aplicados.' }
    ],
    faqs: [
      { q: '¿Cómo editar un PDF gratis online?', a: 'PDFRápido te permite editar archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro editar PDFs con PDFRápido?', a: 'Sí, la edición se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Editar PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Editar PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Firmar PDF',slug:'firmar-pdf'},{name:'Anotar PDF',slug:'anotar-pdf'},{name:'Marca de agua',slug:'marca-agua'}]
  },
  {
    slug: 'firmar-pdf',
    name: 'Firmar PDF',
    action: 'firmar',
    category: 'Editar PDF',
    categorySlug: 'editar-pdf',
    privacyType: 'local',
    featureList: 'Firma PDF con imagen o dibujo, Múltiples estilos de firma, Procesamiento local en navegador, Sin marca de agua, Sin límite de archivos firmados',
    title: 'Firmar PDF Gratis Online | PDFRápido',
    description: 'Firma PDF gratis y sin registro. Añade tu firma con imagen o dibujo directamente en tu navegador. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Firmar PDF Gratis Online | PDFRápido',
    ogDesc: 'Añade tu firma a PDFs con imagen o dibujo. Gratis, sin registro, procesamiento local.',
    answerFirst: 'PDFRápido te permite firmar archivos PDF añadiendo tu firma mediante imagen o dibujo directamente en tu navegador. El procesamiento es instantáneo y privado. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Firma local con imagen o dibujo a mano alzada','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Sin marca de agua en el resultado'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona el PDF que quieres firmar.' },
      { strong: 'Añade firma', text: 'Sube una imagen de tu firma o dibújala directamente con el ratón/dedo.' },
      { strong: 'Descarga', text: 'Guarda tu PDF firmado con la firma posicionada donde prefieras.' }
    ],
    faqs: [
      { q: '¿Cómo firmar un PDF gratis online?', a: 'PDFRápido te permite firmar archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro firmar PDFs con PDFRápido?', a: 'Sí, el proceso de firma se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Firmar PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Firmar PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Editar PDF',slug:'editar-pdf'},{name:'Anotar PDF',slug:'anotar-pdf'},{name:'Proteger PDF',slug:'proteger-pdf'}]
  },
  {
    slug: 'rotar-pdf',
    name: 'Rotar PDF',
    action: 'rotar',
    category: 'Editar PDF',
    categorySlug: 'editar-pdf',
    privacyType: 'local',
    featureList: 'Rotación de páginas PDF en ángulos de 90°, 180° y 270°, Rotación selectiva por página, Procesamiento local en navegador, Sin marca de agua, Sin límite de archivos',
    title: 'Rotar PDF Gratis Online | PDFRápido',
    description: 'Rota páginas PDF gratis y sin registro. Gira páginas en ángulos de 90°, 180° o 270°. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Rotar PDF Gratis Online | PDFRápido',
    ogDesc: 'Rota páginas de tu PDF en ángulos de 90°, 180° o 270°. Gratis, sin registro, procesamiento local.',
    answerFirst: 'PDFRápido te permite rotar páginas de archivos PDF en ángulos de 90°, 180° o 270°, seleccionando páginas específicas o todas a la vez. El procesamiento es instantáneo en tu navegador. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Rotación local con ángulos de 90°, 180° y 270°','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Rotación selectiva por página o todas'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona el PDF con las páginas que quieres rotar.' },
      { strong: 'Selecciona rotación', text: 'Elige el ángulo (90°, 180°, 270°) y las páginas a rotar.' },
      { strong: 'Descarga', text: 'Guarda tu PDF con las páginas orientadas correctamente.' }
    ],
    faqs: [
      { q: '¿Cómo rotar un PDF gratis online?', a: 'PDFRápido te permite rotar archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro rotar PDFs con PDFRápido?', a: 'Sí, la rotación se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Rotar PDF?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Rotar PDF en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Editar PDF',slug:'editar-pdf'},{name:'Organizar PDF',slug:'organizar-pdf'},{name:'Comprimir PDF',slug:'comprimir-pdf'}]
  },
  {
    slug: 'extraer-paginas',
    name: 'Extraer páginas',
    action: 'extraer páginas de',
    category: 'Organizar PDF',
    categorySlug: 'organizar-pdf',
    privacyType: 'local',
    featureList: 'Extracción selectiva de páginas PDF, Vista previa de miniaturas, Procesamiento local en navegador, Descarga individual o combinada, Sin límite de páginas',
    title: 'Extraer Páginas PDF Gratis Online | PDFRápido',
    description: 'Extrae páginas de un PDF gratis y sin registro. Selección visual con miniaturas. Gratuito, sin registro, procesamiento local. Prueba ahora.',
    ogTitle: 'Extraer Páginas PDF Gratis Online | PDFRápido',
    ogDesc: 'Extrae páginas específicas de tu PDF con vista previa visual. Gratis, sin registro, procesamiento local.',
    answerFirst: 'PDFRápido te permite extraer páginas específicas de archivos PDF seleccionándolas visualmente mediante miniaturas. El procesamiento es instantáneo en tu navegador. Es gratuito, no requiere registro y funciona en cualquier dispositivo.',
    tldr: ['Gratuito y sin registro','Extracción local con vista previa de miniaturas','Tus archivos nunca salen de tu dispositivo','Funciona en PC, móvil y tablet','Descarga individual o combinada de páginas'],
    howItWorks: [
      { strong: 'Sube tu archivo', text: 'Arrastra o selecciona el PDF del que quieres extraer páginas.' },
      { strong: 'Selecciona', text: 'Haz clic en las miniaturas de las páginas que quieres extraer.' },
      { strong: 'Descarga', text: 'Obtén las páginas extraídas en un solo PDF o descárgalas individualmente.' }
    ],
    faqs: [
      { q: '¿Cómo extraer páginas de un PDF gratis online?', a: 'PDFRápido te permite extraer páginas de archivos PDF directamente desde tu navegador, sin instalar nada ni crear una cuenta. El procesamiento es local con WebAssembly y gratuito.' },
      { q: '¿Es seguro extraer páginas de PDFs con PDFRápido?', a: 'Sí, la extracción se realiza completamente en tu navegador mediante tecnología WebAssembly. Tus documentos nunca se suben a ningún servidor ni se comparten con terceros.' },
      { q: '¿PDFRápido tiene límite de archivos o tamaño?', a: 'No. PDFRápido es completamente gratuito y sin límites de uso. Puedes procesar tantos archivos como necesites, del tamaño que sea, sin restricciones.' },
      { q: '¿Necesito registrarme para usar Extraer páginas?', a: 'No. PDFRápido no requiere registro ni cuenta de usuario. Abres la herramienta, subes tu archivo y descargas el resultado inmediatamente.' },
      { q: '¿Funciona Extraer páginas en móvil y tablet?', a: 'Sí, PDFRápido funciona en cualquier dispositivo con navegador moderno: PC, Mac, tablet y móvil. No necesitas instalar ninguna aplicación.' }
    ],
    related: [{name:'Dividir PDF',slug:'dividir-pdf'},{name:'Unir PDF',slug:'unir-pdf'},{name:'Eliminar páginas',slug:'eliminar-paginas'}]
  }
];

function generateSchema(tool) {
  const webApp = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": `${tool.name} - PDFRápido`,
        "url": `https://pdfrapido.eu/${tool.slug}/`,
        "description": tool.description.replace(/\| PDFRápido$/, '').trim(),
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
        "author": { "@type": "Person", "name": "MF Sanchez", "url": "/sobre-mf-sanchez/" },
        "inLanguage": "es",
        "isAccessibleForFree": true,
        "featureList": tool.featureList
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://pdfrapido.eu" },
          { "@type": "ListItem", "position": 2, "name": tool.category, "item": `https://pdfrapido.eu/${tool.categorySlug}/` },
          { "@type": "ListItem", "position": 3, "name": tool.name }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": tool.faqs.map(f => ({"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}}))
      }
    ]
  };
  return `<script type="application/ld+json">\n${JSON.stringify(webApp, null, 2)}\n</script>`;
}

const INJECTED_STYLES = `<style>
.answer-first{font-size:17px;line-height:1.7;color:var(--gray-700);margin:16px 0 20px;max-width:700px;text-align:center;margin-left:auto;margin-right:auto}
.tldr{list-style:none;padding:0;margin:0 auto 32px;max-width:700px;display:grid;gap:8px}
.tldr li{font-size:15px;color:var(--gray-600);background:var(--gray-50);padding:10px 16px;border-radius:8px;border:1px solid var(--gray-200)}
.comparison{width:100%;max-width:700px;margin:20px auto 40px;border-collapse:collapse;font-size:15px}
.comparison th,.comparison td{padding:12px 16px;text-align:left;border:1px solid var(--gray-200)}
.comparison th{background:var(--secondary);color:#fff;font-weight:600}
.comparison tr:nth-child(even){background:var(--gray-50)}
.faq-section{max-width:700px;margin:40px auto}
.faq-section h2{font-size:24px;font-weight:700;color:var(--secondary);margin-bottom:20px}
.faq-section details{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;margin-bottom:12px;overflow:hidden}
.faq-section summary{padding:16px 20px;font-size:15px;font-weight:600;color:var(--secondary);cursor:pointer;list-style:none;position:relative}
.faq-section summary::-webkit-details-marker{display:none}
.faq-section summary::after{content:'+';position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:20px;color:var(--primary);font-weight:400}
.faq-section details[open] summary::after{content:'−'}
.faq-section details p{padding:0 20px 16px;margin:0;font-size:15px;color:var(--gray-600);line-height:1.7}
.related-tools-nav{display:flex;flex-wrap:wrap;gap:10px;max-width:700px;margin:0 auto 40px}
.related-tools-nav a{display:inline-block;padding:10px 20px;background:#fff;border:1px solid var(--gray-200);border-radius:100px;font-size:14px;font-weight:500;color:var(--secondary);text-decoration:none;transition:all .2s}
.related-tools-nav a:hover{border-color:var(--primary);color:var(--primary)}
.author-byline{text-align:center;padding:24px;background:var(--gray-50);border-top:1px solid var(--gray-200);margin-top:auto}
.author-byline p{font-size:13px;color:var(--gray-500);margin:0}
.author-byline a{color:var(--primary);text-decoration:none;font-weight:500}
.author-byline a:hover{text-decoration:underline}
</style>`;

function processPage(tool) {
  const filePath = path.join(__dirname, '..', tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) { console.warn('File not found: '+filePath); return false; }
  let html = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Schema
  const graphRegex = /<script type="application\/ld\+json">\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@graph":\s*\[[\s\S]*?\]\s*\}\s*<\/script>/i;
  const newSchema = generateSchema(tool);
  if (graphRegex.test(html)) { html = html.replace(graphRegex, newSchema); modified = true; console.log('  Updated @graph schema'); }
  else { const headClose = html.indexOf('</head>'); if (headClose !== -1) { html = html.slice(0, headClose) + '\n' + newSchema + '\n' + html.slice(headClose); modified = true; console.log('  Inserted new schema'); } }

  // Meta tags
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${tool.title}</title>`);
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"/i, `<meta name="description" content="${tool.description}"`);
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"/gi, `<meta property="og:title" content="${tool.ogTitle}"`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"/gi, `<meta property="og:description" content="${tool.ogDesc}"`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"/gi, `<meta property="og:url" content="https://pdfrapido.eu/${tool.slug}/"`);
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"/gi, `<meta property="og:image" content="https://pdfrapido.eu/assets/og-${tool.slug}.png"`);
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"/gi, `<meta name="twitter:title" content="${tool.ogTitle}"`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"/gi, `<meta name="twitter:description" content="${tool.ogDesc}"`);
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"/gi, `<meta name="twitter:image" content="https://pdfrapido.eu/assets/og-${tool.slug}.png"`);
  modified = true;
  console.log('  Updated meta tags');

  // Styles
  if (!html.includes('.answer-first')) {
    const headIdx = html.indexOf('</head>');
    if (headIdx !== -1) { html = html.slice(0, headIdx) + INJECTED_STYLES + '\n' + html.slice(headIdx); modified = true; console.log('  Injected styles'); }
  }

  // H1 + answer-first
  const h1Regex = /(<div class="tool-header">[\s\S]*?<h1>)[^<]*(<\/h1>[\s\S]*?<p>)[^<]*(<\/p>[\s\S]*?<\/div>)/i;
  const thRegex = /(<div class="th">[\s\S]*?<h1>)[^<]*(<\/h1>[\s\S]*?<p>)[^<]*(<\/p>[\s\S]*?<\/div>)/i;
  const tldrItems = tool.tldr.map(t => `    <li>✅ ${t}</li>`).join('\n');
  const answerFirstHtml = `\n    <h1>¿Cómo ${tool.action} un PDF gratis online?</h1>\n    <p class="answer-first">${tool.answerFirst}</p>\n    <ul class="tldr">\n${tldrItems}\n    </ul>`;
  if (h1Regex.test(html)) { html = html.replace(h1Regex, answerFirstHtml); modified = true; console.log('  Updated tool-header'); }
  else if (thRegex.test(html)) { html = html.replace(thRegex, answerFirstHtml); modified = true; console.log('  Updated .th'); }
  else { const simpleH1 = /<h1>[^<]*<\/h1>/i; if (simpleH1.test(html)) { html = html.replace(simpleH1, `<h1>¿Cómo ${tool.action} un PDF gratis online?</h1>`); modified = true; console.log('  Updated h1 text'); } }

  // Sections before footer
  const footerRegex = /<footer[\s\S]*?<\/footer>/i;
  const footerMatch = html.match(footerRegex);
  if (footerMatch) {
    const footerIdx = html.indexOf(footerMatch[0]);
    const beforeFooter = html.slice(0, footerIdx);
    const afterFooter = html.slice(footerIdx + footerMatch[0].length);
    if (!beforeFooter.includes('class="comparison"')) {
      const howItems = tool.howItWorks.map(h => `      <li><strong>${h.strong}</strong> - ${h.text}</li>`).join('\n');
      const faqDetails = tool.faqs.map(f => `    <details>\n      <summary>${f.q}</summary>\n      <p>${f.a}</p>\n    </details>`).join('\n');
      const relatedLinks = tool.related.map(r => `    <a href="/${r.slug}/">${r.name}</a>`).join('\n');
      const newSections = `
    <h2>¿Cómo funciona?</h2>
    <ol>
${howItems}
    </ol>
    <h2>¿Por qué elegir PDFRápido?</h2>
    <table class="comparison">
      <thead><tr><th>Característica</th><th>PDFRápido</th><th>iLovePDF</th><th>Smallpdf</th></tr></thead>
      <tbody>
        <tr><td>Gratuito</td><td>✅ Sí</td><td>⚠️ Limitado</td><td>❌ No</td></tr>
        <tr><td>Sin registro</td><td>✅ Sí</td><td>❌ No</td><td>❌ No</td></tr>
        <tr><td>Procesamiento local</td><td>✅ Sí</td><td>❌ No</td><td>❌ No</td></tr>
        <tr><td>Límite de archivos</td><td>✅ Sin límite</td><td>❌ Sí</td><td>❌ Sí</td></tr>
      </tbody>
    </table>
    <section class="faq-section">
      <h2>Preguntas frecuentes</h2>
${faqDetails}
    </section>
    <h2>Otras herramientas PDF</h2>
    <nav class="related-tools-nav">
${relatedLinks}
    </nav>
    <footer class="author-byline">
      <p>Por <a href="/sobre-mf-sanchez/" rel="author">MF Sanchez</a>, desarrollador de herramientas PDF desde 2023. <a href="https://github.com/mfsanchez/pdfrapido">Ver código en GitHub</a></p>
    </footer>`;
      html = beforeFooter + newSections + '\n' + footerMatch[0] + afterFooter;
      modified = true;
      console.log('  Added sections before footer');
    }
  }

  // Breadcrumb
  const bcRegex = /<div role="navigation" aria-label="breadcrumb"[\s\S]*?<\/div>/i;
  const bcMatch = html.match(bcRegex);
  if (bcMatch && !bcMatch[0].includes(tool.category)) {
    const newBc = `<div role="navigation" aria-label="breadcrumb" style="max-width:1140px;margin:0 auto;padding:20px 24px 16px;font-size:13px;color:var(--gray-400)">
    <ol style="list-style:none;padding:0;margin:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <li><a href="/" style="color:var(--gray-400);text-decoration:none">Inicio</a></li>
        <li aria-hidden="true" style="color:var(--gray-300)">›</li>
        <li><a href="/${tool.categorySlug}/" style="color:var(--gray-400);text-decoration:none">${tool.category}</a></li>
        <li aria-hidden="true" style="color:var(--gray-300)">›</li>
        <li style="color:var(--gray-600);font-weight:500">${tool.name}</li>
    </ol>
</div>`;
    html = html.replace(bcRegex, newBc);
    modified = true;
    console.log('  Updated breadcrumb');
  }

  if (modified) { fs.writeFileSync(filePath, html, 'utf8'); console.log('  Saved\n'); return true; }
  else { console.log('  No changes\n'); return false; }
}

console.log('PDFRapido SEO IA Optimization\n');
let success = 0, failed = 0;
for (const tool of TOOLS) {
  console.log(tool.name + ' (' + tool.slug + ')');
  try { if (processPage(tool)) success++; else failed++; }
  catch (err) { console.error('Error: ' + err.message); failed++; }
}
console.log('\nDone: ' + success + ' success, ' + failed + ' failed');
