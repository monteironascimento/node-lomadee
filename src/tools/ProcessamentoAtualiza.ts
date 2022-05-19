import axios from 'axios';

import { endPointDesEnum , endPointProdEnum} from '../enum/EndPointEnum';
const endPoint = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'? endPointProdEnum : endPointDesEnum)

async function startProcessamento(obj: any) {

    const urlStartProcessamento = `${endPoint.urlServidorDatabase}/startSincronizacao`
    const responsaProcessamento = await axios.post(urlStartProcessamento, obj)
    return responsaProcessamento.data;
}

async function finalizarProcessamento(obj: any) {

    const urlFinalizaProcessamento = `${endPoint.urlServidorDatabase}/finalizaSincronizacao`
    const responsaProcessamento = await axios.post(urlFinalizaProcessamento, obj);
    return responsaProcessamento.data;
}


async function registraProcessado(obj: any) {

    const urlNotificaProcessado = `${endPoint.urlServidorDatabase}/registraProcessado`;
    const responseNotificaProcessado = await axios.post(urlNotificaProcessado, obj);
   
    return responseNotificaProcessado.data;
}


export { startProcessamento , finalizarProcessamento, registraProcessado};

 

 

