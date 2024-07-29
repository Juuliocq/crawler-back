import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as limit from 'p-limit';
import * as cheerio from 'cheerio';
import { IMusica } from './imusica/imusica.interface';

@Injectable()
export class AppService {
  totalPaginas: number;
  paginaAtual: number;
  musicas: Set<IMusica> = new Set();
  vistos: string[] = [];
  limite: any = limit(10);

  constructor(private readonly http: HttpService) {}

  async start(pesquisa: string): Promise<Set<IMusica>> {
    const { data } = await this.http
      .get(`http://guitarflash.com/custom/lista.asp?pag=0`)
      .toPromise();

    const $ = cheerio.load(data);
    const totalPaginas = +$('b').eq(1).text();

    const urlPaginas: string[] = [];

    for (let i = 0; i < totalPaginas; i++) {
      urlPaginas.push(`http://guitarflash.com/custom/lista.asp?pag=${i}`);
    }

    await this.fetchUrlsInBatches(urlPaginas)
      .then((response) => {
        for (const html of response) {
          const $ = cheerio.load(html.data);

          const aTags = $('a');
          aTags.each((index, element) => {
            const text = $(element).text(); // Captura o texto entre <a> e </a>
            if (text.toLowerCase().includes(pesquisa.toLowerCase())) {
              const href = $(element).attr('href'); // Captura o valor do atributo href
              this.add({
                nome: text,
                url: href,
              });
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    return this.musicas;
  }

  async fetchUrlsInBatches(urls: string[]): Promise<any[]> {
    try {
      // Executa as requisições em paralelo com limite de concorrência
      const responses = await Promise.all(
        urls.map((url) => this.limite(() => this.fetchUrl(url))),
      );
      // Retorna as respostas após todas as requisições serem concluídas
      return responses;
    } catch (error) {
      console.error('Error fetching URLs in batches:', error.message);
      // Lança o erro para tratamento posterior
      throw error;
    }
  }

  async fetchUrl(url: string): Promise<any> {
    try {
      const response = await this.http.get(url).toPromise();
      return response; // Retorna a resposta
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw error; // Propagar o erro para tratamento posterior
    }
  }

  add(musica: IMusica) {
    if (this.vistos.includes(musica.url)) {
      return; // Se o id já foi visto, não inclua o item
    }

    this.musicas.add(musica);
    this.vistos.push(musica.url);
  }
}
