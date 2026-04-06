export interface SlackErrorBlockParams {
  error: string;
  cause: string;
  correlationId: string;
  user: string;
  request: any;
  reason?: string;
}

export const slackErrorBlockBuilder = (params: SlackErrorBlockParams) => {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':red_circle: Error',
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error*: ${params.error}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Cause*: ${params.cause}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Time*: ${new Date()}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*CorrelationId*: ${params.correlationId}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*User*: ${params.user}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Request*',
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_preformatted',
          border: 0,
          elements: [
            {
              type: 'text',
              text: `${params.request}`,
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Reason*',
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_preformatted',
          border: 0,
          elements: [
            {
              type: 'text',
              text: `${params.reason}`,
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
  ];
};
