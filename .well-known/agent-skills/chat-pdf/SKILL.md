# Chat con PDF

Permite hacer preguntas en lenguaje natural sobre el contenido de un documento PDF.

## Endpoint
POST https://pdfrapido.eu/api/chat-pdf

## Input
- PDF (multipart/form-data, campo `file`)
- Pregunta en texto (campo `pregunta`)

## Output
- Respuesta en texto basada en el contenido del PDF

## Uso
Útil para consultar información específica en documentos sin leerlos completos.
