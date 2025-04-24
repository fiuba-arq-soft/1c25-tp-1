# TP #1 Arquitectura del Software 1C2025 - Grupo Architecture Summit

En el siguiente repositorio, mostramos los avances que realizamos con nuestro TP.
Nuestro trabajo puede resumirse en los siguientes puntos: 

## Versionado de APIs
Versionamos la API en distintas versiones. 
- v1: Caso base
- v1.1: Caso con modificaciones hechas en el código por nosotros (Mejora de busquedas, validaciones, etc)
- v2: Caso reemplazando los archivos json por Redis

Para hacer uso y cambiar la versión, en Postman, es necesario enviar esta URL junto con el método correspondiente: http://{{host}}:{{port}}/{{version}}/accounts

Donde host es localhost, port es 5555, y version es v1, v1.1 o v2

## Dashboards de grafana
Para grafana creamos 2 dashboards:
- Infra (O normal): Con el que se evalua cada request, incluyendo los casos de Artillery
- Business: Con las métricas de volumen operado y neto
En grafana, se deben crear los datasource graphite-infra (Con URL http://graphite-infra:80) y graphite-business (Con URL http://graphite-business:80)

## Puertos 
Asi quedaron los puertos para el TP:
- Grafana: 8100
- Graphite Infra => 8091
- Graphite Business => 8090

## Escenarios de Artillery 
En la carpeta perf, creamos los escenarios de Artillery. Tenemos todo organizado de esta forma:
- accounts.yaml: Tiene los escenarios para el GET y el POST (Para el caso de Redis en el que hay
que crear las cuentas a mano) de Cuentas. Se prueba para cada una de sus versiones (Una a la vez), 
y se usa el archivo balances.csv para setear los balances de las cuentas.
- logs.yaml: Tiene los escenarios para el GET de Logs. Se prueba para cada una de sus versiones 
(Una a la vez)
- rates.yaml: Tiene los escenarios para el GET y PUT de Rates. Se prueba para cada una de sus 
versiones (Una a la vez), y se usa el archivo rates.csv para setear los rates.
- exchanges.yaml: Tiene los escenarios para el POST de Exchange. Se prueba para cada una de sus 
versiones (Una a la vez), y se usa el archivo exchanges.csv para setear los exchanges.

Y dentro de Run_Scenarios están los resultados de Artillery

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
- Tácticas de diseño: Se comentan algunas de las tácticas de diseño realizadas para mejorar
los QAs del sistema.
- Tradeoff-QAs: Se analiza el tradeoff que hay entre QAs para las diferentes decisiones
de diseño realizadas para el proyecto
- Resultados grafana: Se muestran los resultados de grafana al correr los distintos escenarios
de Artillery
