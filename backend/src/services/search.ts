import { Client } from '@elastic/elasticsearch';
import { config } from '../config';

export const esClient = new Client({
  node: config.elasticsearchUrl,
});

const INDEX_NAME = 'emails';

export async function initElasticsearch(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            sender: { type: 'keyword' },
            recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduled_for: { type: 'date' },
            sent_at: { type: 'date' },
            created_at: { type: 'date' },
            provider_message_id: { type: 'keyword' },
            last_error: { type: 'text' },
          },
        },
      });
      console.log(`[ES] Created index '${INDEX_NAME}'`);
    } else {
      console.log(`[ES] Index '${INDEX_NAME}' already exists`);
    }
  } catch (err: any) {
    console.error(`[ES] Error initializing Elasticsearch: ${err.message}`);
  }
}

export async function indexEmail(email: {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduled_for: Date | string;
  sent_at?: Date | string | null;
  provider_message_id?: string | null;
  last_error?: string | null;
  created_at?: Date | string;
}): Promise<void> {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: email.id,
      document: {
        id: email.id,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduled_for: new Date(email.scheduled_for).toISOString(),
        sent_at: email.sent_at ? new Date(email.sent_at).toISOString() : null,
        provider_message_id: email.provider_message_id || null,
        last_error: email.last_error || null,
        created_at: email.created_at ? new Date(email.created_at).toISOString() : new Date().toISOString(),
      },
      refresh: true, // make searchable immediately
    });
  } catch (err: any) {
    console.error(`[ES] Failed to index email ${email.id}:`, err.message);
  }
}

export async function searchEmails(query?: string, filters?: { status?: string; sender?: string }): Promise<any[]> {
  try {
    const must: any[] = [];

    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ['subject^2', 'body', 'recipient', 'sender'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (filters?.status) {
      must.push({ term: { status: filters.status } });
    }
    if (filters?.sender) {
      must.push({ term: { sender: filters.sender } });
    }

    const res = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must,
        },
      },
      sort: [{ scheduled_for: { order: 'desc' } }],
    });

    return res.hits.hits.map(hit => hit._source);
  } catch (err: any) {
    console.error('[ES] Search error:', err.message);
    return [];
  }
}
