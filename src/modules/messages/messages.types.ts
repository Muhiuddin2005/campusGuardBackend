import { MessageSender } from '@prisma/client';

export type TSendReporterMessagePayload = {
  passcode: string;
  body: string;
};

export type TGetReporterThreadPayload = {
  passcode: string;
};

export type TSendAuthorityMessagePayload = {
  body: string;
};

export type TMessageResponse = {
  id: string;
  sender: MessageSender;
  body: string;
  createdAt: Date;
};
