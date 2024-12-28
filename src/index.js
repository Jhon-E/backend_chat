import express from "express";
import logger from "morgan";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { turso } from "./conectionDb.js";
import userRoutes from "./routes/users.routes.js";

const PORT = 8000;

const app = express();

app.use(logger("dev"));

const server = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//ENDPOINT HANDLER
app.use(userRoutes);

//SOCKETS HANDLER
io.on("connect", async (socket) => {
  let result;
  console.log("Se conectó este user:", socket.id);
  /* RELATION ONE USER WITH ONE SOCKET IN THE DDBB */
  socket.on("setUserId", async (idUser) => {
    try {
      result = await turso.execute({
        sql: "INSERT INTO sockets (id, id_user) VALUES (:socketId, :idUser)",
        args: { socketId: socket.id, idUser },
      });
    } catch (e) {
      console.log(e);
    }

    /* GET ALL ONLINE USERS */
    try {
      result = await turso.execute(
        "SELECT u.id AS id_user, s.id AS id_socket, u.nombre FROM sockets AS s INNER JOIN users AS u ON s.id_user = u.id"
      );
      console.log("Usuarios online: ", result.rows);

      io.emit("usersOnline", result.rows);
    } catch (e) {
      console.log("Error al obtener usuarios online.");
    }
  });

  /* CHAT MESSAGE EVENT */

  socket.on(
    "chat-message",
    async ({ msg, targetSocket, targetId, targetName, sourceName }) => {
      let result;
      try {
        /* result = await turso.execute({
        sql: "INSERT INTO messages (content) VALUES (:message)",
        args: { message: data.msg },
      }); */
        /* EMITO EL MENSAJE A AMBOS SOCKET CON EL CONTENIDO Y EL ID DE USUARIO TARGET */
        console.log({ msg, targetSocket, targetId, targetName, sourceName });

        io.to(targetSocket).emit("chat-message", {
          id: targetId,
          msg,
          name: targetName,
          sourceName,
        });
        socket.emit("chat-message", {
          id: targetId,
          msg,
          name: targetName,
          sourceName,
        });
      } catch (e) {
        console.log(e);
      }
      //io.emit("chat-message", data.msg, result.lastInsertRowid.toString());
    }
  );

  /* DISCONNECT EVENT */

  socket.on("disconnect", async () => {
    console.log("se desconecto este user", socket.id);
    try {
      await turso.execute({
        sql: "DELETE FROM sockets WHERE id LIKE (:socketId)",
        args: { socketId: socket.id },
      });
    } catch (e) {
      console.log(e);
    }
    /* UPDATE ONLINE USERS */
    try {
      result = await turso.execute(
        "SELECT u.id AS id_user, s.id AS id_socket, u.nombre FROM sockets AS s INNER JOIN users AS u ON s.id_user = u.id"
      );
      console.log("Usuarios online: ", result.rows);

      io.emit("usersOnline", result.rows);
    } catch (e) {
      console.log("Error al obtener usuarios online.");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});
