import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client';
import { convertHourStringToMunites } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
  log: ['query']
})

app.get('/games', async (request, response) => {

  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  });

  return response.json(games);
})

app.get('/ads', (request, response) => {
  return response.status(201).json([]);
})

app.get('/games/:id/ads', async (request, response) => {
  const { id: gameId } = request.params;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const result = ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd),
    }
  })

  return response.json(result);
})

app.get('/ads/:id/discord', async (request, response) => {
  const { id } = request.params;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true
    },
    where: {
      id
    }
  })

  return response.json({
    discord: ad.discord
  })
})

app.post('/games/:id/ads', async (request, response) => {
  const { id: gameId } = request.params;
  const { body } = request;

  console.log(gameId)

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: convertHourStringToMunites(body.hourStart),
      hourEnd: convertHourStringToMunites(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  return response.json(ad);
})

app.listen(3333)