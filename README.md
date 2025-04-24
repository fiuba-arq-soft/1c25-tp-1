# TP #1 Arquitectura del Software 1C2025 - Grupo Architecture Summit

En el siguiente repositorio, mostramos los avances que realizamos con nuestro TP.
Nuestro trabajo puede resumirse en los siguientes puntos: 

## Versionado de APIs
Versionamos la API en distintas versiones. 
- v1: Caso base
- v1.1: Caso con modificaciones hechas en el código por nosotros (Mejora de busquedas, validaciones, etc)
- v2: Caso reemplazando los archivos json por Redis

Para hacer uso y cambiar la versión, en Postman, es necesario enviar esta URL junto con el método correspondiente: http://{{host}}:{{port}}/{{version}}/accounts

Donde host es localhost, port es 5555, y versin es v1, v1.1 o v2

## Puertos 
Asi quedaron los puertos para el TP:
- Grafana: 8100
- Graphite Infra (Con el que se evalua cada request, incluyendo los casos de Artillery) => 8091
- Graphite Business (Con las métricas de volumen operado y neto) => 8090

## Diagramas
En la carpeta diagramas, están los diagramas de components & connectors del caso base
de la arquitectura (Como se nos fue dado), del caso modificado (El caso añadiendo todas 
nuestras mejoras) y el caso final (El caso con Redis y la arquitectura final de la 
entrega)

## Informes
En la carpeta informes, están los distintos informes en los que se hacen distintos análisis
de la arquitectura, del proyecto y demas.
- Analisis y critica de la arquitectura: Se describe la arquitectura, los componentes y capas
de la misma, los servicios presentes, y se hace una crítica a alguno de los puntos de la
arquitectura. 
- Analisis QAs relevantes: Se analizan los atributos de calidad que importan para este
proyecto, separandolos en criticos, importantes pero no críticos, y menos relevantes
- Análisis de diseño y QAs: Se hace el análisis del diseño de la arquitectura base, y cómo
afecta a los distintos QAs. También se hace una crítica, y se explican las mejoras que se 
hicieron a nivel código, y cómo estas afectan a los distintos QAs.