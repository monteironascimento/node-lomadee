import { Router } from 'express';
import axios from 'axios';
import { finalizarProcessamento, startProcessamento } from '../tools/ProcessamentoAtualiza';
import { tipoServicoEnum } from '../enum/TipoServicoEnum';
import { TipoInformacaoEnum } from '../enum/TipoInformacaoEnum';
import { endPointDesEnum , endPointProdEnum} from '../enum/EndPointEnum';
import { isEmpty } from '../tools/Empty';

//const app_token = ["1615324127221b346b417", "161918425970877a96420","1614815510064693eda4f","16149076379163d862b68"];
const app_token = ["1615324127221b346b417", "161918425970877a96420","1614815510064693eda4f","1615324127221b346b417","161918425970877a96420", "1621014213358ba0d2f6b", "16210142470738ebe67de"]; //DISPONIVEL PARA OFERTAS
const app_source_id = "36957958";
const endPoint = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? endPointProdEnum : endPointDesEnum)

const categoriasRouter = Router();

categoriasRouter.get("/", async (req, res) => {

    const objProcessamento:any = await startProcessamento({ 
        idPlataforma: 1,           
        idPlataformaConta: 1,      
        tipoServico : tipoServicoEnum.LOMADEE,         
        tipoInformacao : TipoInformacaoEnum.CATEGORIA,         
        dataProcessamentoInicio: Date()
    })

    try{ 
        const url = `https://api.lomadee.com/v3/${app_token[Math.floor(Math.random() * app_token.length)]}/category/_all?sourceId=${app_source_id}`
        
        
        let objtoCategoria = await axios.get(url);
        
        await axios.get(url);
        
        const listaCategorias: any[] = objtoCategoria.data.categories;

        const listaCategoriasPost: any[] = [];

        for (var objS in listaCategorias) { 

            try{

                const objCategoria = listaCategorias[objS];
                
                const objPost = {
                    idLomadee : objCategoria.id,
                    descricao: objCategoria.name,
                    hasOffer: objCategoria.hasOffer,
                    link : objCategoria.link,
                    idSincronizacao : objProcessamento.idSincronizacao,
                    appToken : app_token[Math.floor(Math.random() * app_token.length)],
                    appSourceId: app_source_id
                };

                listaCategoriasPost.push(objPost);
                

            }catch(error){
                console.log(error);
                objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
            }

        }

        if(!isEmpty(listaCategoriasPost)){
            const urlCategoriaDatabase = `${endPoint.urlServidorDatabase}/categoria`    
            await axios.post(urlCategoriaDatabase, listaCategoriasPost);
            console.log(`SINCRO: ${objProcessamento.idSincronizacao} CATEGORIA:   Processando Quantidade  ${listaCategoriasPost.length}`);     
        }
        
    }catch(error){
        console.log(error);
        objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
    }  


    await finalizarProcessamento({ 
        idSincronizacao : objProcessamento.idSincronizacao,
        descricaoErro : objProcessamento.descricaoErro,
        tipoServico : objProcessamento.tipoServico,         
        tipoInformacao : objProcessamento.tipoInformacao,
        dataProcessamentoFim: Date()
    });

    console.log(`SINCRO: ${objProcessamento.idSincronizacao} PROCESSO FINALIZADO!`);
      
    return res.status(201).json({ status: "OK"});
})


export { categoriasRouter };


        /*
          {
            id: 1076,
            name: 'Leite de Coco',
            hasOffer: 0,
            link: 'http://api.lomadee.com/v3/1614815510064693eda4f/category/_id/1076?sourceId=22973334'
        },
  */