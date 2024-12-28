import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const {
  url = process.env.TURSO_DATABASE_URL,
  authToken = process.env.TURSO_AUTH_TOKEN,
} = process.env;

export const turso = createClient({
  url,
  authToken,
});

try {
  await turso.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    password TEXT
)`);
} catch (e) {
  console.log("Error al crear la tabla users: ", e);
}

try {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER NOT NULL,
        id_source INTEGER NOT NULL,
        content TEXT,
        FOREIGN KEY (id_user) REFERENCES users(id),
        FOREIGN KEY (id_source) REFERENCES users(id)
    )
  `);
} catch (e) {
  console.log("Error al crear la tabla messages: ", e);
}

try {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS sockets (
        id TEXT PRIMARY KEY NOT NULL,
        id_user INTEGER NOT NULL UNIQUE,
        FOREIGN KEY (id_user) REFERENCES users(id)
    )
  `);
} catch (e) {
  console.log("Error al crear la tabla sockets: ", e);
}
