# Informe de Diagnóstico y Plan de Revisión del Backend (YARP, APIs y gRPC)

Este informe detalla el análisis de la arquitectura actual del backend, la explicación de la falla **502 Bad Gateway** reportada por la persona encargada de la integración, la verificación del contrato de integración YAML y un plan de acción paso a paso para asegurar el funcionamiento del sistema en producción (Render).

---

## 1. Diagnóstico del Error: "¿Por qué salió 502 Bad Gateway?"

Un error **502 Bad Gateway** en Render indica que el balanceador de carga o puerta de enlace de Render (Nginx/Cloudflare) intentó dirigir la solicitud hacia tu servicio, pero **no pudo obtener una respuesta válida**. En nuestro diseño, el punto de entrada es el **ApiGateway (YARP)**.

Existen **tres hipótesis principales** de por qué el integrador se topó con esta pantalla al invocar a `https://apigateway-mr.onrender.com/api/v1/mathias-rivera/alojamientos`:

### Hipótesis 1: El Gateway no tiene configuradas las variables de entorno de YARP en Render
* **Explicación:** En el archivo `appsettings.json` del ApiGateway, las direcciones de destino de los clústeres están configuradas por defecto para el entorno de desarrollo local:
  ```json
  "alojamientos-cluster": {
    "Destinations": {
      "destination1": { "Address": "http://localhost:5002/" }
    }
  }
  ```
  Si el servicio de Render **`apigateway-mr`** no tiene configuradas las variables de entorno para anular estas direcciones, intentará redirigir el tráfico a `localhost:5002` dentro de su propio contenedor en Render. Al no haber nada escuchando en el puerto 5002 local del contenedor del Gateway, YARP lanza una excepción de conexión rechazada (`SocketException: Connection refused`) y responde con un código **502 Bad Gateway**.
* **Solución:** Verificar que en el dashboard de Render de tu servicio **`apigateway-mr`**, en la sección **Environment**, estén definidas las siguientes variables:
  * `ReverseProxy__Clusters__alojamientos-cluster__Destinations__destination1__Address` = `https://alojamientosmr-api.onrender.com/` *(o la URL real de tu API de Alojamientos)*
  * `ReverseProxy__Clusters__reservas-cluster__Destinations__destination1__Address` = `https://reservasmr-api.onrender.com/` *(o la URL real de tu API de Reservas)*

---

### Hipótesis 2: Suspensiones por inactividad ("Cold Start") de Render Free Tier
* **Explicación:** Los servicios web gratuitos en Render entran en estado de suspensión (suspenden el contenedor) tras **15 minutos de inactividad**.
  * Cuando el integrador hace una petición después de un tiempo, Render inicia un "Cold Start" para encender el contenedor del ApiGateway y de los microservicios aguas arriba (`Alojamientos.API` o `Reservas.API`).
  * Despertar un servicio de .NET en Render Free Tier puede tardar **de 30 a 50 segundos**.
  * Si el ApiGateway despierta pero el microservicio de destino (`Alojamientos.API`) sigue dormido y YARP intenta conectarse inmediatamente, la petición puede fallar por tiempo de espera agotado (Timeout) o error de conexión, devolviendo un 502/504.
* **Solución:** Realizar una solicitud de "calentamiento" directamente a las URL públicas de las API de fondo (`https://alojamientosmr-api.onrender.com/` y `https://reservasmr-api.onrender.com/`) antes de realizar la prueba integrada a través del Gateway.

---

### Hipótesis 3: Caída/Falla de arranque del Microservicio Destino (`Alojamientos.API`)
* **Explicación:** Si `Alojamientos.API` tiene problemas internos al arrancar en Render (por ejemplo, una cadena de conexión a Supabase incorrecta, falta de credenciales o un error ejecutando migraciones automáticas), el contenedor del microservicio entrará en un ciclo de reinicio o se detendrá de inmediato.
  * Al intentar llamar al Gateway, YARP intentará conectar con el microservicio caído y, al no recibir respuesta, lanzará un error de gateway devolviendo **502 Bad Gateway**.
* **Solución:** Revisar los registros de despliegue ("Logs") del servicio `alojamientosmr-api` en Render para corroborar que el mensaje `Application started. Press Ctrl+C to shut down.` haya aparecido con éxito.

---

## 2. Revisión del Contrato de Integración (YAML)
Se ha verificado detalladamente el contrato OpenAPI en `alojamiento-booking-gateway-contrato.yaml` frente a las implementaciones de los controladores de ASP.NET Core y las reglas de transformación del Gateway.

> [!TIP]
> **El contrato de integración YAML está excelentemente diseñado, es correcto y está garantizado para el uso del integrador.**

### Puntos clave validados:
1. **Servidores Declarados:** Declara correctamente la URL de producción expuesta por el Gateway (`https://apigateway-mr.onrender.com`) y el puerto local de desarrollo (`http://localhost:5001`), proporcionando una excelente guía de servidor.
2. **Coincidencia de Rutas de YARP:**
   * **Alojamientos:** El contrato declara rutas bajo `/api/v1/mathias-rivera/alojamientos`. YARP intercepta esto con la regla:
     * `Match: "/api/v1/mathias-rivera/alojamientos/{**remainder}"`
     * `Transform: "/api/v1/alojamientos/{**remainder}"`
     * Esto redirige a `GET/POST /api/v1/alojamientos` en `AlojamientosController.cs`, lo cual coincide 100%.
   * **Calendario:** El contrato declara `/api/v1/mathias-rivera/calendario/...`. YARP intercepta esto y lo transforma a `/api/v1/calendario/...`, mapeando correctamente a `CalendarioController.cs`.
   * **Booking (Reservas):** El contrato declara `/api/v1/mathias-rivera/booking/...`. YARP intercepta esto y lo transforma a `/api/v1/reservas/...`, mapeando correctamente a `ReservasController.cs`.
3. **Estructuras de DTOs:** Los esquemas OpenAPI coinciden exactamente con los records de C# (`CrearReservaRequest`, `AlojamientoResponse`, `CalendarioResponse`, etc.) definidos en las capas de negocio de los microservicios.

---

## 3. Plan Detallado de Revisión de Funcionamiento y Conectividad

Para solucionar el inconveniente del integrador y asegurar que todo el ecosistema (Gateway, APIs, gRPC y Eventos) funcione sin fricciones, se debe ejecutar el siguiente plan estructurado:

### Paso 1: Pruebas de Salud Individuales (Aislamiento de Servicios)
Antes de probar a través del Gateway, asegúrate de que cada microservicio responda de forma independiente.
* **Acción:** Abre un navegador o Postman e invoca directamente los endpoints de Swagger o de verificación de cada API:
  * **Alojamientos API:** `GET https://alojamientosmr-api.onrender.com/swagger/index.html` (o un endpoint simple como `GET https://alojamientosmr-api.onrender.com/api/v1/alojamientos`)
  * **Reservas API:** `GET https://reservasmr-api.onrender.com/swagger/index.html` (o `GET https://reservasmr-api.onrender.com/api/v1/reservas/resumen/cliente/1`)
  * **Usuarios API:** `GET https://usuariosmr-api.onrender.com/swagger/index.html`
* **Resultado Esperado:** Deben responder `200 OK` (o `404 Not Found` controlado si no existen registros, pero **nunca** un 502/503 de Render). Si alguna API da 502, el problema está en esa API y no en el Gateway.

### Paso 2: Auditoría de Variables de Entorno del Gateway
* **Acción:** Ve al panel de control de Render, selecciona el Web Service del **ApiGateway** (`apigateway-mr`) y entra a **Environment**.
* **Verificación:** Asegúrate de que las variables de anulación estén escritas con doble guión bajo (`__`) para respetar la jerarquía de configuración de .NET:
  * **Variable 1:**
    * *Clave:* `ReverseProxy__Clusters__alojamientos-cluster__Destinations__destination1__Address`
    * *Valor:* `https://alojamientosmr-api.onrender.com/` *(asegura el HTTPS y el slash final)*
  * **Variable 2:**
    * *Clave:* `ReverseProxy__Clusters__reservas-cluster__Destinations__destination1__Address`
    * *Valor:* `https://reservasmr-api.onrender.com/`
* **Acción 2:** Guarda los cambios si es necesario. Esto forzará un nuevo despliegue automático del Gateway con las rutas correctas.

### Paso 3: Inspección de Logs en Render
* **Acción:** Si se vuelve a producir un 502, revisa inmediatamente la pestaña **Logs** en el dashboard de Render de cada servicio:
  * **En `apigateway-mr` (Gateway):** Busca excepciones de YARP. Si dice `ConnectException` o `HttpRequestException: Connection refused`, el Gateway no puede alcanzar el microservicio debido a una URL incorrecta en las variables de entorno o porque el microservicio está caído.
  * **En `alojamientosmr-api` / `reservasmr-api`:** Busca excepciones al arrancar. Los errores típicos son `Npgsql.PostgresException` (contraseña de base de datos incorrecta, bloqueo de IP de Supabase o falta de sslmode requerido) o `RabbitMQ.Client.Exceptions.BrokerUnreachableException` (URL de CloudAMQP mal ingresada).

### Paso 4: Verificación de la Conexión gRPC-Web (Reservas ➡️ Alojamientos)
El servicio de Reservas llama sincrónicamente al Calendario de Alojamientos mediante gRPC. En Render, esto viaja sobre HTTP/1.1 usando **gRPC-Web**.
* **Acción:** Verifica que la API de Reservas tenga la variable de entorno:
  * *Clave:* `GrpcUrls__Alojamientos`
  * *Valor:* `https://alojamientosmr-api.onrender.com` *(debe ser la URL pública, no localhost)*
* **Prueba:** Intenta crear una reserva llamando a `POST /api/v1/mathias-rivera/booking`.
  * Si la reserva se crea con éxito o devuelve un error lógico esperado (como `"Habitación no disponible"`), la conexión gRPC-Web funciona perfectamente.
  * Si arroja un error `500 Internal Server Error` con el detalle `Grpc.Core.RpcException` o `Content-Type application/grpc-web is missing`, significa que gRPC-Web no está activo en Alojamientos o el cliente de Reservas no está usando el canal web.

### Paso 5: Verificación del Bus de Eventos (RabbitMQ / CloudAMQP)
* **Acción:** Ingresa a la consola de administración de CloudAMQP usando tu enlace AMQP.
* **Verificación:** Confirma que existan colas activas llamadas `factura-pagada-event` o similares y que haya al menos dos conexiones registradas (Reservas.API como consumidor y Facturacion.API como publicador).

---

## 4. Resumen de Estado del Sistema

A continuación se muestra una tabla de referencia del estado ideal de cada componente en producción:

| Componente / Microservicio | Tipo de Comunicación | Puerto Local | Endpoint Base Externo (Vía Gateway) | Variables Clave en Render |
| :--- | :--- | :--- | :--- | :--- |
| **ApiGateway (YARP)** | REST (Entrada) | `8080` (en Docker) | N/A (Raíz) | `ReverseProxy__Clusters__alojamientos-cluster__Destinations__destination1__Address`<br/>`ReverseProxy__Clusters__reservas-cluster__Destinations__destination1__Address` |
| **Alojamientos.API** | REST + gRPC-Web | `5002` | `/api/v1/mathias-rivera/alojamientos`<br/>`/api/v1/mathias-rivera/calendario` | `ConnectionStrings__ConexionAlojamientos` |
| **Reservas.API** | REST + gRPC Client | `5003` | `/api/v1/mathias-rivera/booking` | `ConnectionStrings__ConexionReservas`<br/>`ConnectionStrings__RabbitMQ`<br/>`GrpcUrls__Alojamientos` |
| **Facturacion.API** | REST + RabbitMQ Pub | `5005` | `/api/v1/mathias-rivera/facturacion` | `ConnectionStrings__ConexionFacturacion`<br/>`ConnectionStrings__RabbitMQ` |
| **Usuarios.API** | REST | `5004` | `/api/v1/mathias-rivera/usuarios` | `ConnectionStrings__ConexionUsuarios` |
