import express from "express";
import { lojasRouter } from './routes/lojas.route';
import { categoriasRouter } from './routes/categorias.route';
import { ofertasRouter } from './routes/ofertas.route';
import { cuponsRouter } from './routes/cupons.route';

const port = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? 3061 : 3060);

const app = express();
console.log(`START  NODE-CRUD-LOMADEE - AMBIENTE ${process.env.NODE_ENV}   PORTA ${port}`)

app.use(express.json());

app.use( "/lojas", lojasRouter);
app.use( "/categorias", categoriasRouter);
app.use( "/ofertas", ofertasRouter);
app.use( "/cupons", cuponsRouter);

app.get('/', (require, response) => {
    console.log("SERVIDOR RODANDO NORMALMENTE ----- OK")
    return response.json({status: "OK"});
})

app.get('/', (require, response) => {

    return response.json({status: "OK"});
})

app.listen(port);