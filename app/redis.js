import { createClient } from "redis";

const client = createClient({
  url: "redis://redis:6379",
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Reintentando conexión a Redis. Intento: ${retries}`);
      if (retries > 10) {
        return new Error("No se pudo reconectar a Redis");
      }
      return 1000; // espera 1 segundo entre intentos
    },
  },
});

client.on("error", (err) => console.error("Redis Client Error", err));
client.on("connect", () => console.log("Redis conectado"));
client.on("reconnecting", () => console.log("Reconectando a Redis"));
client.on("end", () => console.log("Conexión con Redis cerrada"));

async function initRedis() {
  await client.connect();
}

export { client, initRedis };

// await client.hSet('user-session:123', {
//     name: 'John',
//     surname: 'Smith',
//     company: 'Redis',
//     age: 29
// })

// let userSession = await client.hGetAll('user-session:123');
// console.log(JSON.stringify(userSession, null, 2));
/*
{
  "surname": "Smith",
  "name": "John",
  "company": "Redis",
  "age": "29"
}
 */
