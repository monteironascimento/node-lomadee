import { Router } from 'express';
import axios from 'axios';
import { finalizarProcessamento, startProcessamento } from '../tools/ProcessamentoAtualiza';
import { isEmpty } from '../tools/Empty';
import { tipoServicoEnum } from '../enum/TipoServicoEnum';
import { TipoInformacaoEnum } from '../enum/TipoInformacaoEnum';
import { endPointDesEnum , endPointProdEnum} from '../enum/EndPointEnum';
const endPoint = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? endPointProdEnum : endPointDesEnum)

//const app_token = ["1615324127221b346b417", "161918425970877a96420","1614815510064693eda4f","16149076379163d862b68"];
const app_token = ["16149076379163d862b68"]; //FIXO CUPON
const app_source_id = "36957958";

const cuponsRouter = Router();

cuponsRouter.get("/", async (req, res) => {

    const objProcessamento:any = await startProcessamento({ 
      idPlataforma: 1,           
      idPlataformaConta: 1,      
      tipoServico : tipoServicoEnum.LOMADEE,         
      tipoInformacao : TipoInformacaoEnum.CUPONS,         
      dataProcessamentoInicio: Date(),
    })

    try {
      const url = `https://api.lomadee.com/v2/${app_token[Math.floor(Math.random() * app_token.length)]}/coupon/_all?sourceId=${app_source_id}`
      let objtoCupons = await axios.get(url);

      const listaCupons: any[] = objtoCupons.data.coupons;
      const listaCuponsTurbo: any[] = [];

      for (var objS in listaCupons) { 
        try{

            const objStore = listaCupons[objS];
            
            const objPost = {
                idLomadee : objStore.id,
                descricao: objStore.description,
                code: objStore.code,
                disconto: objStore.discount,
                dataVigencia: new Date(objStore.vigency), //new Date(),
                dataVigenciaValidar: objStore.vigency, //new Date(),
                link : objStore.link,
                new: objStore.new,
                idSincronizacao : objProcessamento.idSincronizacao,

                idLojaLomadee: objStore.store.id,
                nomeLojaLomadee: objStore.store.name,
                thumbnailLojaLomadee: objStore.store.image,
                linkLojaLomadee: objStore.store.link,

                idCategoriaLomadee: objStore.category.id,
                nomeCategoria: objStore.category.name,
                
                appToken : app_token[0],
                appSourceId: app_source_id, 
            };
            listaCuponsTurbo.push(objPost);

        }catch(error){
            console.log(error);
            objProcessamento.descricaoErro = ` ${objProcessamento.descricaoErro} - ${error}`
        }

      }

      //console.log(listaCuponsTurbo)

      if(!isEmpty(listaCuponsTurbo)){
        const urlCuponsDatabase = `${endPoint.urlServidorDatabase}/cupons`
        const response = await axios.post(urlCuponsDatabase, listaCuponsTurbo);
        console.log(`SINCRO: ${objProcessamento.idSincronizacao} CUPON: Processando Quantidade ${listaCuponsTurbo.length} -------------  `);
      }


    } catch (error) {
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


export { cuponsRouter };

/*{
   id: 11918,
    description: '40% de desconto em Livros de Saúde na Grupo A',
    code: 'MESDASAUDE',
    discount: 40,
    store: {
      id: 6362,
      name: 'Grupo A',
      image: 'https://www.lomadee.com/programas/BR/6362/logo_185x140.png',
      link: 'https://redir.lomadee.com/v2/direct/aHR0cHM6Ly9sb2phLmdydXBvYS5jb20uYnIv/22973334/12718'
    },
    category: { id: 3482, name: 'Livros' },
    vigency: '30/04/2021 23:59:00',
    link: 'https://redir.lomadee.com/v2/direct/aHR0cHM6Ly9sb2phLmdydXBvYS5jb20uYnIv/22973334/12718',
    new: true
  },
},*/