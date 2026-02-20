import express from 'express'
import {buscarProcessoTJCE} from './dataJudTJCE.js'
import cors from "cors"
import userRoutes from './Routes/user.js'
import processRoutes from './Routes/process.js'
import dotenv from 'dotenv';

dotenv.config();
const app = express()
app.use(express.json());
app.use(cors())

app.use('/users', userRoutes)
app.use('/process', processRoutes)


app.get('/processo/:numero', async (req,res) =>{
  try{
       const resposta = await buscarProcessoTJCE(req.params.numero)
      const process = {
        // Identificação básica
        numeroProcesso: resposta[0]._source.numeroProcesso,
        tribunal: resposta[0]._source.tribunal,
        grau: resposta[0]._source.grau,
        // Classe e sistema
        classe: {
          codigo: resposta[0]._source.classe.codigo,
          nome: resposta[0]._source.classe.nome
        },
        sistema: {
          nome: resposta[0]._source.sistema.nome,
          formato: resposta[0]._source.formato.nome
        },
        // Datas importantes
        dataAjuizamento: parseDataAjuizamento(resposta[0]._source.dataAjuizamento),
        dataUltimaAtualizacao: resposta[0]._source.dataHoraUltimaAtualizacao,
        // Órgão julgador
        orgaoJulgador: {
          nome: resposta[0]._source.orgaoJulgador.nome,
          codigo: resposta[0]._source.orgaoJulgador.codigo,
          municipioIBGE: resposta[0]._source.orgaoJulgador.codigoMunicipioIBGE
        },
        // Assuntos
        assuntos: resposta[0]._source.assuntos,
        // Sigilo
        nivelSigilo: resposta[0]._source.nivelSigilo,
        // Movimentações completas (com detalhes)
        movimentos: resposta[0]._source.movimentos,    
        // Última movimentação detalhada
        ultimaMovimentacao: {
          nome: resposta[0]._source.movimentos[resposta[0]._source.movimentos.length - 1]?.nome,
          dataHora: resposta[0]._source.movimentos[resposta[0]._source.movimentos.length -1]?.dataHora,
          codigo: resposta[0]._source.movimentos[resposta[0]._source.movimentos.length -1]?.codigo,
          orgaoJulgador: resposta[0]._source.movimentos[resposta[0]._source.movimentos.length -1]?.orgaoJulgador,
          complementos: resposta[0]._source.movimentos[resposta[0]._source.movimentos.length -1]?.complementosTabelados
        },
        // Status atual (baseado nos movimentos)
        status: getStatus(resposta[0]._source.movimentos),
        
        // NOVA: Fase atual amigável
        faseAtual: getFaseAtual(resposta[0]._source.movimentos),
        
        // Decisões importantes
        decisoes: resposta[0]._source.movimentos.filter(m => 
          m.codigo === 219 || 
          m.codigo === 12164 || 
          m.codigo === 246 || 
          m.codigo === 332
        ),
        // Petições
        peticoes: resposta[0]._source.movimentos.filter(m => m.codigo === 85),
        // Mandados
        mandados: resposta[0]._source.movimentos.filter(m => 
          m.codigo === 106 || m.codigo === 985
        ),
        // Conclusões
        conclusoes: resposta[0]._source.movimentos.filter(m => m.codigo === 51),
        // Distribuição/Redistribuição
        distribuicao: resposta[0]._source.movimentos.find(m => m.codigo === 26),
        redistribuicao: resposta[0]._source.movimentos.find(m => m.codigo === 36),
        // Decurso de prazo
        prazos: resposta[0]._source.movimentos.filter(m => m.codigo === 1051),
        // Documentos expedidos
        documentos: resposta[0]._source.movimentos.filter(m => 
          m.codigo === 60 || m.codigo === 581
        ),
        // Certidões
        certidoes: resposta[0]._source.movimentos.filter(m => 
          m.codigo === 581 && 
          m.complementosTabelados?.some(c => c.nome === "Certidão")
        ),
        // Dados estatísticos
        diasTramitacao: calcularDias(resposta[0]._source.dataAjuizamento),
        totalMovimentacoes: resposta[0]._source.movimentos.length,
        diasUltimaAtualizacao: calcularDiasDesde(resposta[0]._source.dataHoraUltimaAtualizacao)
      }
      res.json(process);
  }catch(error){
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar processo no DataJud" });
  }
})

function getStatus(movimentos) {
  const ultimoMovimento = movimentos[0];
  
  if (ultimoMovimento.codigo === 246) return "Arquivado Definitivamente";
  if (ultimoMovimento.codigo === 219) return "Sentença Proferida";
  if (ultimoMovimento.codigo === 849) return "Reativado";
  if (ultimoMovimento.codigo === 51) {
    const tipo = ultimoMovimento.complementosTabelados?.[0]?.nome;
    return `Concluso ${tipo || ''}`;
  }
  
  return "Em Andamento";
}

function getFaseAtual(movimentos) {
  const primeiro = movimentos[0];
  
  // Mapeamento para fases genéricas e amigáveis
  const mapeamentoFases = {
    // Conclusões
    51: {
      "para decisão": "Aguardando Decisão",
      "para despacho": "Aguardando Despacho",
      "para julgamento": "Aguardando Julgamento"
    },
    // Outras fases
    246: "Processo Arquivado",
    219: "Processo Julgado",
    849: "Processo em Andamento",
    332: "Tutela Antecipada",
    12164: "Fase Decisória",
    14736: "Tramitação Digital",
    85: "Instrução Processual",
    106: "Cumprimento de Mandado",
    1051: "Aguardando Manifestação",
    36: "Redistribuição",
    26: "Distribuição Inicial"
  };
  
  // Se for conclusão, pega o tipo específico
  if (primeiro.codigo === 51) {
    const tipoConclusao = primeiro.complementosTabelados?.[0]?.nome;
    return mapeamentoFases[51][tipoConclusao] || "Fase Processual";
  }
  
  return mapeamentoFases[primeiro.codigo] || "Em Andamento";
}

function calcularDias(dataInicio) {
  const inicio = new Date(
    dataInicio.substring(0,4),
    dataInicio.substring(4,6)-1,
    dataInicio.substring(6,8)
  );
  const hoje = new Date();
  return Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
}

function calcularDiasDesde(dataISO) {
  const data = new Date(dataISO);
  const hoje = new Date();
  return Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
}

function parseDataAjuizamento(data) {
        const ano = data.substring(0, 4)
        const mes = data.substring(4, 6)
        const dia = data.substring(6, 8)

        return (`${ano}-${mes}-${dia}`)
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
