import { Router } from 'express';
import axios from 'axios';
import { finalizarProcessamento, startProcessamento } from '../tools/ProcessamentoAtualiza';
import { tipoServicoEnum } from '../enum/TipoServicoEnum';
import { TipoInformacaoEnum } from '../enum/TipoInformacaoEnum';
import { isEmpty } from '../tools/Empty';
import { endPointDesEnum , endPointProdEnum} from '../enum/EndPointEnum';
const endPoint = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? endPointProdEnum : endPointDesEnum)

const ofertasRouter = Router();

export { ofertasRouter };
let processos: any[] = []


ofertasRouter.get("/", async (req: any, res) => {

    const objProcessamento:any = await startProcessamento({ 
        idPlataforma: 1,           
        idPlataformaConta: 1,      
        tipoServico : tipoServicoEnum.LOMADEE,         
        tipoInformacao : TipoInformacaoEnum.OFERTA,         
        dataProcessamentoInicio: Date()
    })

    //if(req.query.fonte == 1){
    console.log("BUSCANDO LOJAS")
    const urlDatabaseFindLojas = `${endPoint.urlServidorDatabase}/lojas`
    const listaLojas = await axios.get(urlDatabaseFindLojas);

    if(!isEmpty(listaLojas.data)) {
           
        let countLoja = 0; 
        let totalLoja = listaLojas.data.length;

        console.log(`INICIANDO PROCESSAMENTO ${totalLoja}`)

        for (var objL in listaLojas.data) {
            
            countLoja++;
            const objLoja = listaLojas.data[objL];
            try {
                processaLoja(objLoja, objProcessamento, countLoja, totalLoja, objLoja.idLoja, 0 )// 0 - Loja
            } catch (error) {
                    
            }       
        }  

    }

    console.log("BUSCANDO CATEGORIAS")
    
    const urlDatabaseFindCategoriasA = `${endPoint.urlServidorDatabase}/categorias`
    let listaCategoriasAtivas ;
    try {
        listaCategoriasAtivas = await axios.get(urlDatabaseFindCategoriasA);
    } catch (error) {
        
    }

    //DEFINI QT PROESSOS SINCRONISMO
    let limit = 1200;
    try {
        
        if(listaCategoriasAtivas.data.length > 4){
            limit = listaCategoriasAtivas.data.length / 4
        }else{
            limit = 1
        }  
    } catch (error) {
            
    }


    //BUSCA CATEGORIAS ATIVAS PARA SINCRONIZAR
    let offset = 0;
    let inProcessar = true;

    do{
        const urlDatabaseFindCategorias = `${endPoint.urlServidorDatabase}/categoriasAtivasLimit?limit=${limit}&offset=${offset}`
        const listaCategorias = await axios.get(urlDatabaseFindCategorias);
        if(!isEmpty(listaCategorias.data)) {
            processoAsincronoCategoria(listaCategorias.data, objProcessamento)    
        }else{
            inProcessar = false;
        }
        offset = offset + limit
    }while(inProcessar) 
    
    console.log(`SINCRO: ${objProcessamento.idSincronizacao}  PROCESSO FINALIZADO!`);
      
    return res.status(201).json({ status: "OK"});
})

async function processoAsincronoCategoria(objlistCategoria: any, objProcessamento: any){
    let countCategoria = 0; 
    let totalCategoria = objlistCategoria.length;

    console.log(`INICIANDO PROCESSAMENTO CATEGORIA ${totalCategoria}`)

    for (var objL in objlistCategoria) {
        
        countCategoria++;
        const objCategoria = objlistCategoria[objL];
        try {

            for (const key in objCategoria.idLomadee.split(',')) {
                const objAjustadoIdLomadee = objCategoria;
                objAjustadoIdLomadee.idLomadee = objCategoria.idLomadee.split(',')[key]

                processos.push(objAjustadoIdLomadee.descricao);
                await processaLoja(objAjustadoIdLomadee, objProcessamento, countCategoria, totalCategoria, objAjustadoIdLomadee.idCategoria, 1) //1-Categoria
            }
            
        } catch (error) {
                
        }      
    }  
    return "OK"
}


async function processaLoja(objLoja: any, objProcessamento: any, countLoja: number, totalLoja: number, idLoja: number, tpInformacao: number){

    let finalizaProcesso = true;
    try{    

        const idProduto = null;
        let idCategoria = null;
        if(tpInformacao == 1){
            idCategoria = idLoja;
            idLoja = null
        }
        console.log(`PROCESSAMENTO ASYNC ${(tpInformacao == 0 ? 'LOJA' : 'CATEGORIA')} ${objLoja.descricao} ---- OFERTAS QT ${objLoja.hasOffer}`)

        let page: number = 0;
        let totalPage: number = 0;
        let totalreg: number = 0;
        let contreg: number = 0;
        let inContem: boolean = false;

        do{

            if(isEmpty(objLoja.idLomadee)){
                let posit = processos.indexOf(objLoja.descricao);
                processos.splice(posit, 1);
                return "OK" 
            }

            page = page + 1

            let url = '';
            if(tpInformacao == 0){
                url = `https://api.lomadee.com/v3/${objLoja.appToken}/offer/_store/${objLoja.idLomadee}?sourceId=${objLoja.appSourceId}&size=100&page=${page}`;
            }else{
                url = `https://api.lomadee.com/v3/${objLoja.appToken}/offer/_category/${objLoja.idLomadee}?sourceId=${objLoja.appSourceId}&size=100&page=${page}`;    

            }

            //url = `http://sandbox-api.lomadee.com/v3/1621014283513f8fd9b3f/offer/_category/${objLoja.idLomadee}?sourceId=${objLoja.appSourceId}&size=100&page=${page}`
            

            //console.log(`BUSCAR PELA ${(tpInformacao == 0 ? 'LOJA' : 'CATEGORIA')} ${objLoja.descricao}    ${objLoja.idLomadee}   ${url}`)
            if(page > totalPage && totalPage > 0){
                break;
            }
            let objetoOfertas: any;

            try {
                objetoOfertas = await axios.get(url);    
            } catch (error) {
                //console.log(error)
            }
            
            if(!isEmpty(objetoOfertas) && objetoOfertas.data.pagination.size >= 1){
                    
                if(totalreg == 0){
                    totalreg = objetoOfertas.data.pagination.totalSize;
                }

                if(totalPage == 0){
                    totalPage = objetoOfertas.data.pagination.totalPage;
                }

                if(page >= totalPage){
                    inContem = false;
                }

                //console.log(`OFERTA  PAGINA DA LOJA : ${objLoja.descricao}   Pagina ${page} - ${totalPage}   REGISTROS ${totalreg}`)

                let listaOffers: any[] = objetoOfertas.data.offers;

                let listaOffersTurbo: any[] = [];  

                for (var objO in listaOffers) { 

                    inContem = true;    
                
                   
                    try{
                        contreg = contreg + 1;
                        const objOffer = listaOffers[objO];

                        const objPost = {
                            idLomadee : objOffer.id,
                            descricao: objOffer.name,
                            hasOffer: objOffer.hasOffer,
                            link : objOffer.link,
                            thumbnail: objOffer.thumbnail,
                            preco: objOffer.price,
                            precoForm: objOffer.priceForm,
                            disconto: objOffer.discount,
                            quantidade: (isEmpty(objOffer.installment) ? 0 : objOffer.installment.quantity),
                            valor: (isEmpty(objOffer.installment) ? 0 : objOffer.installment.value),
                            idLoja: idLoja,
                            idCategoria: idCategoria,
                            idProduto: idProduto,
                            idLojaLomadee: objOffer.store.id,
                            nomeLojaLomadee: objOffer.store.name,
                            thumbnailLojaLomadee: objOffer.store.thumbnail,
                            linkLojaLomadee: objOffer.store.link,
                            invisibleLojaLomadee: objOffer.store.invisible,
                            needPermissionLojaLomadee: objOffer.store.needPermission,
                            idCategoriaLomadee: objOffer.category.id,
                            nomeCategoria: objOffer.category.name,
                            linkCategoria: objOffer.category.link,
                            idSincronizacao : objProcessamento.idSincronizacao,
                            appToken : objLoja.appToken,
                            appSourceId: objLoja.appSourceId, 
                        };
                    
                        listaOffersTurbo.push(objPost);
                    
                    }catch(error){
                        console.log(error);
                        objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
                            
                    }
    
                }

                if(!isEmpty(listaOffersTurbo)){
                    const urlDatabaseOferta = `${endPoint.urlServidorDatabase}/oferta`
                    await axios.post(urlDatabaseOferta, listaOffersTurbo);
                    console.log(`SINCRO: ${objProcessamento.idSincronizacao} OFERTA: ${objLoja.descricao} ${(tpInformacao == 0 ? 'LOJA' : 'CATEGORIA')}  ${countLoja} to ${totalLoja}  /////  PAGINA ${page} - ${totalPage}  REGISTROS(${objetoOfertas.data.pagination.size}) -------  Processando ${contreg} to ${totalreg}`);
                }

                if(objetoOfertas.data.pagination.size < 100){
                    inContem = false;        
                }
            }else{
                inContem = false;   
                finalizaProcesso = false;     
                console.log(`SINCRO: ${objProcessamento.idSincronizacao} OFERTA: ${objLoja.descricao} ${(tpInformacao == 0 ? 'LOJA' : 'CATEGORIA')}  ${countLoja} to ${totalLoja}  /////  SEM REGISTROS`);
            }

        }while(inContem)

    }catch(error){
        console.log(error);
        objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
    }

    if(finalizaProcesso){
        finalizarProcessamento({ 
            idSincronizacao : objProcessamento.idSincronizacao,
            descricaoErro : objProcessamento.descricaoErro,
            tipoServico : objProcessamento.tipoServico,         
            tipoInformacao : objProcessamento.tipoInformacao,
            dataProcessamentoFim: Date()
        });
    }
    
    let posit = processos.indexOf(objLoja.descricao);
    processos.splice(posit, 1);
    
    return "OK" 
}




async function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  } 