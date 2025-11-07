import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://default:825151b0e69387000596@painel1.sdbr.app:6699') 