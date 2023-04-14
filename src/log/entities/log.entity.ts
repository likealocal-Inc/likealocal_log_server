import { Log } from '@prisma/client';

export class LogEntity implements Log {
  id: number;
  created: Date;
  name: string;
  data: string;
  header: string;
}
