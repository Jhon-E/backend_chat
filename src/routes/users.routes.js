import { Router } from "express";
import { turso } from "../conectionDb.js";

const router = Router()

router.get("/users", async (req, res) => {
  let result;
  try {
    result = await turso.execute(
      `SELECT u.id AS id_user, s.id AS id_socket, u.nombre FROM users AS u INNER JOIN sockets AS s ON u.id = s.id_user`
    );

    console.log({ result });

    if (result.rows.length > 0) {
      res.status(201).send(result.rows);
    } else {
      res.status(404).send("No hay usuarios.");
    }
  } catch (e) {
    console.log("Error al obtener usuarios: ", e);
  }
});

router.get("/user", async (req, res) => {
  const user = req.query;

  let result;
  try {
    result = await turso.execute({
      sql: `SELECT id, nombre FROM users where nombre LIKE (:nombre) AND password LIKE (:pass)`,
      args: { nombre: user.nombre, pass: user.pass },
    });

    if (result.rows.length > 0) {
      res.status(201).send(result.rows[0]);
    } else {
      res.status(404).send("No existe este usuario.");
    }
  } catch (e) {
    console.log("Error al loguear: ", e);
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  console.log(id);

  let result;
  try {
    result = await turso.execute({
      sql: `SELECT u.id, s.id , u.nombre FROM users as u INNER JOIN sockets as s ON u.id = s.id_user WHERE u.id = (:id)`,
      args: { id },
    });

    console.log(result);

    if (result.rows.length > 0) {
      res.status(201).send(result.rows[0]);
    } else {
      res.status(404).send("No existe este usuario.");
    }
  } catch (e) {
    console.log("Error al obtener usuario por id: ", e);
  }
});

router.post("/user", async (req, res) => {
  const user = req.body;

  let result;
  try {
    result = await turso.execute({
      sql: `SELECT id, nombre, password FROM users where nombre LIKE (:nombre) AND password LIKE (:pass)`,
      args: { nombre: user.nombre, pass: user.pass },
    });

    if (result.rows.length > 0) {
      res.status(403).send("Este usuario ya existe.");
    }

    result = await turso.execute({
      sql: `INSERT INTO users (nombre, password) VALUES (:nombre, :pass)`,
      args: { nombre: user.nombre, pass: user.pass },
    });

    const newId = result.lastInsertRowid.toLocaleString();

    res.send({ nombre: user.nombre, id: newId });
  } catch (e) {
    console.log("Error al registrar: ", e);
    res.status(501).send(e);
  }
});

export default router