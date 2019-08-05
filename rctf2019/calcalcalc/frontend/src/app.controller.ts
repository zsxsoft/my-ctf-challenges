import { Controller, Get, Render, Post, Body, Res, HttpStatus, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import CalculateModel from './calculate.model';
import * as bson from 'bson';
import Axios, { AxiosResponse } from 'axios';
import { Response, response } from 'express';
import * as bluebird from 'bluebird';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

  @Post('/calculate')
  calculate(@Body() calculateModel: CalculateModel, @Res() res: Response) {
    const serializedBson = bson.serialize(calculateModel);
    const urls = ['10.0.20.11', '10.0.20.12', '10.0.20.13'];
    bluebird.map(urls, async (url) => {
      return Axios.post(`http://${url}/`, serializedBson, {
        headers: {
          'Content-Type': 'text/plain',
        },
        responseType: 'arraybuffer',
      }).catch(e => {
        return { data: e.message, headers: [] };
      });
    }).all().then((responses) => {
      const jsonResponses = responses.map(p => {
        try {
          return bson.deserialize(p.data);
        } catch (e) {
          return p.data.toString('utf-8');
        }
      });
      const set = new Set(jsonResponses.map(p => JSON.stringify(p)));
      this.logger.log(`Expression = ${JSON.stringify(calculateModel.expression)}`);
      this.logger.log('Ret = ' + JSON.stringify(jsonResponses));
      if (set.size === 1) {
        const rand = Math.floor(Math.random() * responses.length);
        Object.keys(responses[rand].headers).forEach((key) => {
          res.setHeader(key, responses[rand].headers[key]);
        });
        res.json(jsonResponses[rand]);
        res.end();
      } else {
        res.end('That\'s classified information. - Asahina Mikuru');
      }
    }).catch((e) => {
      res.status(500).json({ ret: 'Internal error' }).end();
      this.logger.error(e.message, e.trace);
    });
  }

}
