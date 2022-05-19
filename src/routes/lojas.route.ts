import { Router } from 'express';
import axios from 'axios';
import { finalizarProcessamento, startProcessamento } from '../tools/ProcessamentoAtualiza';
import { isEmpty } from '../tools/Empty';
import { tipoServicoEnum } from '../enum/TipoServicoEnum';
import { TipoInformacaoEnum } from '../enum/TipoInformacaoEnum';
import { endPointDesEnum , endPointProdEnum} from '../enum/EndPointEnum';
const endPoint = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? endPointProdEnum : endPointDesEnum)

//const app_token = ["1615324127221b346b417", "161918425970877a96420","1614815510064693eda4f","16149076379163d862b68"];
const app_token = ["1615324127221b346b417", "161918425970877a96420","1614815510064693eda4f","1615324127221b346b417","161918425970877a96420", "1621014213358ba0d2f6b", "16210142470738ebe67de"]; //DISPONIVEL PARA OFERTAS
const app_source_id = "36957958";

const lojasRouter = Router();

lojasRouter.get("/", async (req, res) => {
     
    const objProcessamento:any = await startProcessamento({ 
                                        idPlataforma: 1,           
                                        idPlataformaConta: 1,      
                                        tipoServico : tipoServicoEnum.LOMADEE,         
                                        tipoInformacao : TipoInformacaoEnum.LOJA,         
                                        dataProcessamentoInicio: Date(),
                                    })

    try{
        const url = `https://api.lomadee.com/v3/${app_token[Math.floor(Math.random() * app_token.length)]}/store/_all?sourceId=${app_source_id}`
        const objtoCategoria = await axios.get(url);
        const listaStores: any[] = objtoCategoria.data.stores;

        const listaStoresPost: any[] = [];

        for (var objS in listaStores) { 
            
            try{
                
                const objStore = listaStores[objS];

                const objPost = {
                    idLomadee : objStore.id,
                    descricao: objStore.name,
                    hasOffer: objStore.hasOffer,
                    link : objStore.link,
                    thumbnail: objStore.thumbnail,
                    maxCommission: objStore.maxCommission,
                    idSincronizacao : objProcessamento.idSincronizacao,
                    appToken : app_token[Math.floor(Math.random() * app_token.length)],
                    appSourceId: app_source_id
                };

                listaStoresPost.push(objPost);
              
            }catch(error){
                console.log(error);
                objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
            }
        }

        if(!isEmpty(listaStoresPost)){
            const response = await axios.post(`${endPoint.urlServidorDatabase}/loja`, listaStoresPost);
            console.log(`SINCRO: ${objProcessamento.idSincronizacao} LOJA  Quantidade ${listaStoresPost.length} ------------- `);
        }

    }catch(error){
        console.log(error);
        objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
    } 

    finalizarProcessamento({ 
        idSincronizacao : objProcessamento.idSincronizacao,
        descricaoErro : objProcessamento.descricaoErro,
        tipoServico : objProcessamento.tipoServico,         
        tipoInformacao : objProcessamento.tipoInformacao,        
        dataProcessamentoFim: Date(),
    });

    console.log(`SINCRO: ${objProcessamento.idSincronizacao} PROCESSO FINALIZADO!`);
      
    return res.status(201).json({ status: "OK"});
})

export { lojasRouter };



        /**{
            id: 7625,
            name: 'Cirurgica Sinete',
            thumbnail: 'https://www.lomadee.com/programas/BR/7625/logo_115x76.png',
            link: 'https://redir.lomadee.com/v2/direct/aHR0cHM6Ly93d3cuc2luZXRlY2lydXJnaWNhLmNvbS5ici8=/22973334/12718',
            hasOffer: 0,
            maxCommission: 6.490000000000001,
            events: [
                {
                event: 'Vendas Sinete',
                eventType: 'Sale',
                fixedCommission: false,
                commission: 0.06490000000000001
                }
            ]
            }*/