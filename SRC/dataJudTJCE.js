import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function buscarProcessoTJCE(numeroProcesso) {
  const url = "https://api-publica.datajud.cnj.jus.br/api_publica_tjce/_search";
  const body = {
    query: {
      match: {
        numeroProcesso
      }
    }
  };

  const headers = {
    Authorization: `APIKey ${process.env.DATAJUD_API_KEY}`,
    "Content-Type": "application/json"
  };

  const response = await axios.post(url, body, { headers });

  return response.data.hits.hits;
}
